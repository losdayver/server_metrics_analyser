package handlers

import (
	state "data_analysis/adapter/state_stub"
	"encoding/json"
	"fmt"
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

// Returns identifier of an adapter
func GetIdentifierHandler(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(state.CurrentConfig.Identifier))
}

// Returns list of hosts served by this adapter
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

// Returns list of dials that are avalible on that adapter
func GetDialsHandler(w http.ResponseWriter, r *http.Request) {
	jsonData, err := json.Marshal(state.CurrentConfig.Dials)

	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Write(jsonData)
}

// Measures specified dials on specified host at that moment in time
func PostMeasureHandler(w http.ResponseWriter, r *http.Request) {
	var reqBody PostMeasureReceivedBody

	err := json.NewDecoder(r.Body).Decode(&reqBody)

	if err != nil {
		http.Error(w, "invalid body (parse error)", http.StatusBadRequest)
		return
	}

	found := false
	for _, h := range state.CurrentConfig.Hosts {
		if h.HostName == reqBody.HostName {
			found = true
			break
		}
	}
	if !found {
		http.Error(w, "invalid HostName", http.StatusBadRequest)
		return
	}

	var resBody PostMeasureSentBody

	resBody.HostName = reqBody.HostName

	for _, dialName := range reqBody.DialNames {

		found = false
		var dial state.Dial

		for _, d := range state.CurrentConfig.Dials {
			if d.Name == dialName {
				dial = d
				found = true
				break
			}
		}

		if !found {
			http.Error(w, fmt.Sprintf("dial with name '%s' does not exist", dialName), http.StatusBadRequest)
			return
		}

		resBody.Measures = append(resBody.Measures,
			Measure{
				DialName: dialName,
				Value:    rand.Float64() * float64(dial.Threshold+dial.Threshold/2),
			})
	}

	jsonData, err := json.Marshal(resBody)
	if err != nil {
		http.Error(w, "could not marshal And send body (parse error)", http.StatusBadRequest)
		return
	}

	w.Write(jsonData)
}
