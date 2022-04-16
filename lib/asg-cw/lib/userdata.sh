sudo su
yum update -y
yum install -y httpd
systemctl enable httpd
systemctl start httpd
METADATA="http://169.254.169.254/latest/meta-data"
ID=`curl ${METADATA}/instance-id`
HOSTNAME=`curl ${METADATA}/hostname`
AZ=`curl ${METADATA}/placement/availability-zone`
cat << EOF > /var/www/html/index.html
<h3>ID: `echo $ID`</h3>
<h3>IPv4: `echo $HOSTNAME | awk -F'.' '{print $1}'`</h3>
<h3>Type: `echo $HOSTNAME | awk -F'.' '{print $4}'`</h3>
<h3>AZ: `echo $AZ`</h3>
EOF