package handlers

/* SENT TYPES */

type PostMeasureSentBody struct {
	HostName string
	DialName string
	Value    float64
}

/* RECEIVED TYPES */

type PostMeasureReceivedBody struct {
	HostName string
	DialName string
}
