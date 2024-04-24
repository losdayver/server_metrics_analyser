package handlers

/* SENT TYPES */

// Represents measurement of a dial in time
type Measure struct {
	DialName string
	Value    float64
}

// Represents body that is sent with the response to
// request to measure
type PostMeasureSentBody struct {
	HostName string
	Measures []Measure
}

/* RECEIVED TYPES */

// Represents body that is received by adapter
// that has instructions on what data to fetch
// from what host
type PostMeasureReceivedBody struct {
	HostName  string
	DialNames []string
}
