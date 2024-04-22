package state

import (
	"sync"

	"github.com/gofrs/uuid/v5"
)

var Sessions SessionHashMap = SessionHashMap{
	HashMap: make(map[uuid.UUID]*Session),
	Mutex:   &sync.Mutex{},
}
