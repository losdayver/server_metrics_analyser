package state

import (
	"errors"
	"sync"
	"time"

	"github.com/gofrs/uuid/v5"
)

type Config struct {
	HostName   string
	Port       string
	Identifier string
}

type Measure struct {
	DateTime time.Time
	Value    float64
}

type Dial struct {
	Name string
	Unit string
}

type Session struct {
	Measures []Measure
	Dial     Dial
	HostName string
}

type SessionHashMap struct {
	HashMap map[uuid.UUID]*Session
	Mutex   *sync.Mutex
}

// TODO implement uniqueness check
func (sessionsHashMap SessionHashMap) New(hostName string, dial Dial) uuid.UUID {
	defer sessionsHashMap.Mutex.Unlock()

	sessionToken, _ := uuid.NewV4()

	session := &Session{
		Measures: make([]Measure, 0),
		Dial:     dial,
		HostName: hostName,
	}

	sessionsHashMap.Mutex.Lock()
	sessionsHashMap.HashMap[sessionToken] = session
	return sessionToken
}

func (sessionsHashMap SessionHashMap) Get(id uuid.UUID) (*Session, error) {
	session := sessionsHashMap.HashMap[id]
	if session == nil {
		return nil, errors.New("invalid session id")
	}

	return session, nil
}
