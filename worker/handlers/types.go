package handlers

import "data_analysis/worker/state"

/* SENT TYPES */

type PostAdapterMeasureBody struct {
	HostName string
	DialName string
}

/* RECEIVED TYPES */

type PostCollectStartBody struct {
	HostName string
	Dial     state.Dial
}

type PostCollectDataBody struct {
	SessionID  string
	AdapterURL string
}
