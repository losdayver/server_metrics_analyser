package state

// Represents config of an adapter
type Config struct {
	HostName   string
	Port       string
	Identifier string
	Hosts      []Host
	Dials      []Dial
}

// Represents complete dial object with
// Threshold and RunCount
type Dial struct {
	Name      string
	Unit      string
	Threshold int
	RunCount  int
}

// Represents data about one host
type Host struct {
	HostName string
}
