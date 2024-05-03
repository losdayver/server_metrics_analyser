package main

import (
	handlers "data_analysis/adapter/handlers_stub"
	state "data_analysis/adapter/state_stub"
	"fmt"
	"log"
	"net/http"
	"os"
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

	if len(os.Args) > 1 {
		state.CurrentConfig.Port = os.Args[1]
		state.CurrentConfig.Identifier = os.Args[2]
	}

	mux := http.NewServeMux()

	// Handlers
	mux.HandleFunc("GET /api/identifier/{$}", ApiWrapper(handlers.GetIdentifierHandler))

	mux.HandleFunc("GET /api/hosts/{$}", ApiWrapper(handlers.GetHostsHandler))
	mux.HandleFunc("GET /api/hosts/{host_id}", ApiWrapper(handlers.GetHostHandler))

	mux.HandleFunc("GET /api/dials/{$}", ApiWrapper(handlers.GetDialsHandler))
	mux.HandleFunc("POST /api/measure/{$}", ApiWrapper(handlers.PostMeasureHandler))

	mux.HandleFunc("OPTIONS /api/", handlers.OptionsCorsHandler)

	fmt.Printf("Starting Adapter '%s' on port '%s'\n", state.CurrentConfig.Identifier, state.CurrentConfig.Port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf("%s:%s", state.CurrentConfig.HostName, state.CurrentConfig.Port), mux))
}
