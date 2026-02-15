docker images

# 1. Stop them
docker stop hostinger-ui hostinger-api

# 2. Delete the containers
docker rm hostinger-ui hostinger-api


# Example: docker rmi a1b2c3d4e5f6
docker rmi <YOUR_UI_IMAGE_ID>

# Example: docker rmi 9z8y7x6w5v4u
docker rmi <YOUR_API_IMAGE_ID>

docker builder prune -a -f