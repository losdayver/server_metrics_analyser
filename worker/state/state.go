package state

import (
	"encoding/json"
	"os"
	"sync"
)

var CurrentConfig Config

func Init() {
	fileContents, err := os.ReadFile("./state/state.json")

	if err != nil {
		panic("no state.json found!")
	}

	// Unmarshal JSON into the variable
	err = json.Unmarshal(fileContents, &CurrentConfig)

	if err != nil {
		panic("invalid configuration provided in state.json!")
	}
}

//var Incidents []Incident = make([]Incident, 0)
var Incidents IncidentList = IncidentList{
	Incidents: make([]Incident, 0),
	Mutex:   &sync.Mutex{},
}
