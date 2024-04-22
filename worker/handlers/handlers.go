package handlers

import (
	"bytes"
	"data_analysis/worker/state"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

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
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	sessionToken := state.Sessions.New(reqBody.HostName, reqBody.Dial)

	w.Write([]byte(sessionToken.String()))
}

func PostCollectStopHandler(w http.ResponseWriter, r *http.Request) {

}

func PostCollectDataHandler(w http.ResponseWriter, r *http.Request) {
	var reqBody PostCollectDataBody

	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	sessionID, err := uuid.FromString(reqBody.SessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	session, err := state.Sessions.Get(sessionID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var reqAdapterBody PostAdapterMeasureBody

	reqAdapterBody.DialName = session.Dial.Name
	reqAdapterBody.HostName = session.HostName

	reqAdapterBodyJson, err := json.Marshal(reqAdapterBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resAdapter, err := http.Post(reqBody.AdapterURL,
		"application/json",
		bytes.NewBuffer([]byte(reqAdapterBodyJson)))
	if err != nil && resAdapter.Status != "200" {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var measure state.Measure

	resAdapterBody, err := io.ReadAll(resAdapter.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err = json.NewDecoder(bytes.NewBuffer(resAdapterBody)).Decode(&measure)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	measure.DateTime = time.Now()

	session.Measures = append(session.Measures, measure)

	fmt.Println(session.Measures)
}
