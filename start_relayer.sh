docker build -t relayer .
docker run -d --env-file ./.env relayer