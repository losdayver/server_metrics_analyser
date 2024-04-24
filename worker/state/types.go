package state

import (
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/gofrs/uuid/v5"
)

/* External types */

// Measure object is sent by the adapter upon requesting measures from the adapter
type Measure struct {
	DialName string
	Value    float64
}

/* Internal types */

// Config represents currnet configuration of a worker
type Config struct {
	HostName   string
	Port       string
	Identifier string
}

// Record represents value of a measure in time
type Record struct {
	DateTime time.Time
	Value    float64
}

// Dial represents a dial with its distinct name and unit of measurement
type Dial struct {
	Name string
	Unit string
}

// SessionItem associates dial with slice of records that are supposed
// to be appended to during the lifetime of a worker
type SessionItem struct {
	Dial    Dial
	Records []Record
}

// Session associates name of the host with its session items. Session is serves only one host
type Session struct {
	HostName     string
	SessionItems []SessionItem
	Mutex        *sync.Mutex
}

// SessionHashMap is supposed to contain multiple sessions. DO NOT manipulate instances of this
// object directly, insted use associated with SessionHashMap methods
type SessionHashMap struct {
	HashMap map[uuid.UUID]*Session
	Mutex   *sync.Mutex
}

// New creates a new session based on hostname and the list of dials that are going to be measured
func (sessionsHashMap SessionHashMap) New(hostName string, dials []Dial) uuid.UUID {
	defer sessionsHashMap.Mutex.Unlock()

	sessionToken, _ := uuid.NewV4()

	session := &Session{
		HostName: hostName,
		Mutex:    &sync.Mutex{},
	}

	session.SessionItems = make([]SessionItem, 0)

	for _, dial := range dials {
		session.SessionItems = append(session.SessionItems, SessionItem{
			Dial:    dial,
			Records: make([]Record, 0),
		})
	}

	sessionsHashMap.Mutex.Lock()
	sessionsHashMap.HashMap[sessionToken] = session

	return sessionToken
}

// Get returns a pointer to a session by it's id
func (sessionsHashMap SessionHashMap) Get(id uuid.UUID) (*Session, error) {
	session := sessionsHashMap.HashMap[id]
	if session == nil {
		return nil, errors.New("invalid session id")
	}

	return session, nil
}

// AddMeasures appends values from measures to records of a given session
func (sessionsHashMap SessionHashMap) AddMeasures(id uuid.UUID, measures []Measure) error {
	fmt.Println(measures)

	session, err := sessionsHashMap.Get(id)
	if err != nil {
		return err
	}

	defer session.Mutex.Unlock()
	session.Mutex.Lock()

	for _, measure := range measures {
		for i, sessionItem := range session.SessionItems {
			if measure.DialName == sessionItem.Dial.Name {
				session.SessionItems[i].Records = append(session.SessionItems[i].Records, Record{
					Value:    measure.Value,
					DateTime: time.Now(),
				})
				break
			}
		}
	}

	fmt.Println(session.SessionItems)

	return nil
}
