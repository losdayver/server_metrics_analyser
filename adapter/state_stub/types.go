package state

type Config struct {
	HostName   string
	Port       string
	Identifier string
	Hosts      []Host
	Dials      []Dial
}

type Dial struct {
	Name      string
	Unit      string
	Threshold int
	RunCount  int
}

type Host struct {
	HostName string
}
