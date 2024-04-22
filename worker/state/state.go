package state

import (
	"encoding/json"
	"os"
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
