# 1️⃣ Stop Docker services
sudo systemctl stop docker
sudo snap stop docker

# 2️⃣ Remove old installations and leftovers
sudo apt-get remove -y docker docker.io docker-engine docker-ce docker-ce-cli containerd
sudo snap remove docker docker-compose
sudo rm -rf /var/snap/docker
sudo rm -rf /run/snap.docker
sudo rm -rf /var/lib/docker
sudo rm -rf /etc/docker

# 3️⃣ Install prerequisites
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --batch --yes --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

# 4️⃣ Install Docker CE and Compose plugin
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 5️⃣ Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# 6️⃣ Test Docker
docker ps
docker compose version
