cd ./adapter
go mod tidy
go build -o exec main/main.go
echo Building Adapter finished

cd ../worker
go mod tidy
go build -o exec main/main.go
echo Building Worker finished

cd ../controller
npm install
echo Building Controller finished

echo All ready