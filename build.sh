cd ./adapter
go mod tidy
go build -o exec main/main.go
echo adapter ready

cd ../worker
go mod tidy
go build -o exec main/main.go
echo worker ready

cd ../controller
npm install
echo contoller ready
