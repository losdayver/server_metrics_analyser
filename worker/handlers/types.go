package handlers

import "data_analysis/worker/state"

/* SENT TYPES */

// Represents body sent by worker to adapter to fetch data
type ReqAdapterMeasure struct {
	HostName  string
	DialNames []string
}

/* RECEIVED TYPES */

// Represents a body returned by the adapter when measure is fetched
type ResAdapterMeasure struct {
	HostName string
	Measures []state.Measure
}

// Represents a body that is sent to the worker to initiate session
type PostCollectStartBody struct {
	HostName string
	Dials    []state.Dial
}

// Represents a body that is sent to the worker to make it send a request to a specified adapter
type PostCollectDataBody struct {
	SessionID  string
	AdapterURL string
}
