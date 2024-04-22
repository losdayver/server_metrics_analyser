package handlers

import (
	state "data_analysis/adapter/state_stub"
	"encoding/json"
	"math/rand"
	"net/http"
)

func OptionsCorsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Methods", "*")
	w.Header().Set("Origin", state.CurrentConfig.HostName)

	w.WriteHeader(204)
}

func GetIdentifierHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(state.CurrentConfig.Identifier))
}

func GetHostsHandler(w http.ResponseWriter, r *http.Request) {
	jsonData, err := json.Marshal(state.CurrentConfig.Hosts)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Write(jsonData)
}

func GetHostHandler(w http.ResponseWriter, r *http.Request) {
	http.Error(w, "not implemented", http.StatusBadRequest)
}

func GetDialsHandler(w http.ResponseWriter, r *http.Request) {
	jsonData, err := json.Marshal(state.CurrentConfig.Dials)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Write(jsonData)
}

func PostMeasureHandler(w http.ResponseWriter, r *http.Request) {
	var reqBody PostMeasureReceivedBody

	var err error

	err = json.NewDecoder(r.Body).Decode(&reqBody)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var found bool

	found = false
	var dial state.Dial
	for _, h := range state.CurrentConfig.Dials {
		if h.Name == reqBody.DialName {
			found = true
			dial = h
			break
		}
	}
	if !found {
		http.Error(w, "invalid dial name", http.StatusBadRequest)
		return
	}

	found = false
	for _, h := range state.CurrentConfig.Hosts {
		if h.HostName == reqBody.HostName {
			found = true
			break
		}
	}
	if !found {
		http.Error(w, "invalid host name", http.StatusBadRequest)
		return
	}

	randomMeasure := rand.Float64() * float64(dial.Threshold+dial.Threshold/2)

	resBody := PostMeasureSentBody{
		HostName: reqBody.HostName,
		DialName: reqBody.DialName,
		Value:    randomMeasure,
	}

	jsonData, err := json.Marshal(resBody)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Write(jsonData)
}
