#!/bin/zsh

sudo chsh -s /usr/bin/zsh vscode

echo "Update system components."
sudo apt update -y
sudo apt full-upgrade -y
sudo apt install -y dnsutils iputils-ping

echo "Install packages"
AWSSAMCLI="awssamcli.zip"
curl -fL "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip" -o "$AWSSAMCLI"
unzip ./$AWSSAMCLI -d sam-installation
sudo ./sam-installation/install
npm install -g npm npm-check-updates typescript aws-cdk
pip install boto3

echo "Settings"
git config --global init.defaultBranch main
echo "complete -C '/usr/local/bin/aws_completer' aws" >> ~/.zshrc
source ~/.zshrc

echo "Clean up"
rm -rf ./sam-installation ./$AWSSAMCLI
sudo apt clean
sudo rm -rf /var/lib/apt/lists/*
npm cache clean --force
rm -rf ~/.npm

echo `git --version`
echo `node --version`
echo `python --version`
echo `aws --version`
echo `sam --version`
echo `cdk --version`