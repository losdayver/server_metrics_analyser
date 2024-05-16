cd ./adapter
go mod tidy
go build -o exec/main main/main.go
echo Building Adapter finished

cd ../worker
go mod tidy
go build -o exec/main main/main.go
echo Building Worker finished

cd ../controller
npm install
echo Building Controller finished

cd ../console/src
npm install
echo Building Console finished

echo All ready

cd ..
./run-demo.sh