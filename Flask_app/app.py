from flask import Flask, jsonify
from flask_cors import CORS
import random
from datetime import datetime, timedelta
import uuid
import base64
import json
import base64

app = Flask(__name__)
CORS(app)

def string_to_base64(input_string):
    input_bytes = input_string.encode('utf-8')
    base64_bytes = base64.b64encode(input_bytes)
    base64_string = base64_bytes.decode('utf-8')
    return base64_string

def generate_custom_uuid():
    random_uuid = uuid.uuid4()
    uuid_bytes = random_uuid.bytes
    base64_uuid = base64.urlsafe_b64encode(uuid_bytes).rstrip(b'=')
    return base64_uuid.decode('utf-8')

@app.route('/_cluster/state/clusterblacklist')
def cluster_blacklist():

    num_entries = 100

    code1 = json.dumps({
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "age": 30,
      "email": "john.doe@example.com",
      "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "postalCode": "12345"
      },
      "phoneNumbers": [
        {
          "type": "home",
          "number": "555-555-5555"
        },
        {
          "type": "work",
          "number": "555-555-5556"
        }
      ],
      "hobbies": ["reading", "traveling", "swimming"],
      "isActive": True
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "age": 25,
      "email": "jane.smith@example.com",
      "address": {
        "street": "456 Elm St",
        "city": "Othertown",
        "state": "NY",
        "postalCode": "67890"
      },
      "phoneNumbers": [
        {
          "type": "mobile",
          "number": "555-555-5557"
        }
      ],
      "hobbies": ["painting", "hiking"],
      "isActive": False
    }
  ],
  "products": [
    {
      "id": "A1",
      "name": "Laptop",
      "description": "A high-performance laptop",
      "price": 999.99,
      "available": True,
      "tags": ["electronics", "computer"],
      "ratings": [
        {
          "userId": 1,
          "rating": 5,
          "comment": "Excellent laptop!"
        },
        {
          "userId": 2,
          "rating": 4,
          "comment": "Good value for money."
        }
      ]
    },
    {
      "id": "B2",
      "name": "Smartphone",
      "description": "A latest model smartphone",
      "price": 799.99,
      "available": False,
      "tags": ["electronics", "mobile"],
      "ratings": [
        {
          "userId": 1,
          "rating": 4,
          "comment": "Very good, but a bit pricey."
        }
      ]
    }
  ],
  "orders": [
    {
      "orderId": 101,
      "userId": 1,
      "date": "2023-06-01T10:00:00Z",
      "items": [
        {
          "productId": "A1",
          "quantity": 1,
          "price": 999.99
        },
        {
          "productId": "B2",
          "quantity": 1,
          "price": 799.99
        }
      ],
      "totalAmount": 1799.98,
      "status": "shipped"
    },
    {
      "orderId": 102,
      "userId": 2,
      "date": "2023-06-02T15:30:00Z",
      "items": [
        {
          "productId": "A1",
          "quantity": 2,
          "price": 999.99
        }
      ],
      "totalAmount": 1999.98,
      "status": "processing"
    }
  ]
}
)
    # print(code1)

    code2 = json.dumps({
        "size": 786,
        "query": {
            "script": {
                "lang": "painless",
                "source": """
                def result = 0;
                for (int z=0; z < 190; z++) {
                  for (int y=0; y<360; y++) {
                    result -= z + y;
                  }
                }
                """
            }
        }
    })

    response_json = {
        "cluster_name": "elasticsearch",
        "cluster_uuid": generate_custom_uuid(),
        "cluster_blacklist": ""
    }

    identifiers = [
        "1c8d78ae-4196-4401-a73d-fef0a618beef",
        "17c5381b-17ac-4de4-9cc7-61897f56dcfc",
        "f167fa4f-9685-4ed0-b177-59441900a69f",
        "b7007923-2afc-4d82-857e-c86658f98fb4",
        "a14d515f-0c62-4c15-bca0-3ea7d9892986",
        "8e9073a0-77f8-4ced-b135-1ae42714c68c",
    ]

    nodes = [
        "node1",
        "node2",
        "node3",
        "node4",
        "node5",
        "node6",
    ]

    queries = [
        string_to_base64(code1),
        string_to_base64(code2)
    ]

    now = datetime.now()
    identifiers_length = len(identifiers)
    queries_length = len(queries)
    nodes_length = len(nodes)
    time_format = "%Y-%m-%dT%H:%M:%S.%f"

    cluster_blacklist = []
    for _ in range(num_entries):
        identifier_index = random.randint(0, identifiers_length - 1)
        node_index = random.randint(0, nodes_length - 1)
        query_index = random.randint(0, queries_length - 1)
        execution_time = random.randint(1, 50000)  # Random execution time
        timestamp = now - timedelta(seconds=random.randint(0, 12*3600))  # Random timestamp in the last 12 hours
        timestamp_str = timestamp.strftime(time_format)
        if execution_time > 40000:
            cluster_blacklist.append({
            "Query": queries[query_index],
            "Identifier": identifiers[identifier_index],
            "Timestamp": timestamp_str,
            "ExecutionTime": execution_time,
            "Node": nodes[node_index]
          })
        else:
            cluster_blacklist.append({
            "Query": queries[query_index],
            "Identifier": identifiers[identifier_index],
            "Timestamp": timestamp_str,
            "MemoryUsed": execution_time - 40000,
            "Node": nodes[node_index]
          })

    response_json["cluster_blacklist"] = json.dumps(cluster_blacklist, indent=1)
    return response_json

if __name__ == '__main__':
    app.run(debug=True)