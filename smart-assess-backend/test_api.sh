# Add a candidate via REST API
curl -X POST http://localhost:8080/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  }'

# Get all candidates
curl -X GET http://localhost:8080/api/candidates
