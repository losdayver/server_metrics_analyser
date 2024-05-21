package handlers

import (
	"bytes"
	"data_analysis/worker/state"
	"encoding/json"
	"io"
	"net/http"

	"github.com/gofrs/uuid/v5"
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

func PostCollectStartHandler(w http.ResponseWriter, r *http.Request) {
	var reqBody PostCollectStartBody

	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, "invalid body (parse error)", http.StatusBadRequest)
		return
	}

	sessionToken := state.Sessions.New(reqBody.HostName, reqBody.AdapterIdentifier, reqBody.Dials)

	w.Write([]byte(sessionToken.String()))
}

func PostCollectStopHandler(w http.ResponseWriter, r *http.Request) {

}

func PostCollectDataHandler(w http.ResponseWriter, r *http.Request) {
	var reqBody PostCollectDataBody
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, "invalid body (parse error)", http.StatusBadRequest)
		return
	}

	sessionID, err := uuid.FromString(reqBody.SessionID)
	if err != nil {
		http.Error(w, "invalid UUID (parse error)", http.StatusBadRequest)
		return
	}

	session, err := state.Sessions.Get(sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	reqAdapterBody := ReqAdapterMeasure{
		HostName: session.HostName,
	}

	for _, dialMeasures := range session.SessionItems {
		reqAdapterBody.DialNames = append(reqAdapterBody.DialNames, dialMeasures.Dial.Name)
	}

	reqAdapterBodyJson, err := json.Marshal(reqAdapterBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	req, _ := http.NewRequest("POST", reqBody.AdapterURL,
		bytes.NewBuffer([]byte(reqAdapterBodyJson)))

	client := &http.Client{}
	resAdapter, err := client.Do(req);
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	//{{"HostName":"host1","DialNames":["Proc_All_%"]}} 0x62a140 47 [] false 127.0.0.1:4301 map[] map[] <nil> map[]   <nil> <nil> <nil> {{}} <nil> [] map[]}

	postAdapterMeasureBodyRes, err := io.ReadAll(resAdapter.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var resAdapterBody ResAdapterMeasure

	err = json.NewDecoder(bytes.NewBuffer(postAdapterMeasureBodyRes)).Decode(&resAdapterBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	state.Sessions.AddMeasures(sessionID, resAdapterBody.Measures)

	w.WriteHeader(200)
}

func GetIncidentsHandler(w http.ResponseWriter, r *http.Request) {
	jsonData, _ := json.Marshal(state.Incidents.Incidents)

	w.Write(jsonData)
}

func PostIncidentsHandler(w http.ResponseWriter, r *http.Request) {
	jsonData, _ := json.Marshal(state.Incidents.Incidents)

	_, err := w.Write(jsonData)

	if err == nil {
		state.Incidents.Clear()
	}
}
