package main

import (
	"data_analysis/worker/handlers"
	"data_analysis/worker/state"
	"fmt"
	"log"
	"net/http"
)

// Wraps handler functions, adding CORS headers
func ApiWrapper(handler func(w http.ResponseWriter, r *http.Request)) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		w.Header().Set("Access-Control-Allow-Methods", "*")
		w.Header().Set("Origin", state.CurrentConfig.HostName)

		handler(w, r)
	}
}

func main() {
	state.Init()

	mux := http.NewServeMux()

	// Handlers
	mux.HandleFunc("GET /api/identifier/{$}", ApiWrapper(handlers.GetIdentifierHandler))

	mux.HandleFunc("POST /api/collect/start/{$}", ApiWrapper(handlers.PostCollectStartHandler))
	mux.HandleFunc("POST /api/collect/stop/{$}", ApiWrapper(handlers.PostCollectStopHandler))
	mux.HandleFunc("POST /api/collect/data/{$}", ApiWrapper(handlers.PostCollectDataHandler))

	mux.HandleFunc("OPTIONS /api/", handlers.OptionsCorsHandler)

	log.Fatal(http.ListenAndServe(fmt.Sprintf("%s:%s", state.CurrentConfig.HostName, state.CurrentConfig.Port), mux))
}