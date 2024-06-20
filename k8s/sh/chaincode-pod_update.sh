
CORE_PEER_MSPCONFIGPATH=/var/hyperledger/admin_msp # Select the right path for the admin msp

# Parse args
while getopts "v:c:r:p:" option
do
case "${option}"
in
v) VNUMBER=${OPTARG};;
c) CHAINCODE_NAME=${OPTARG};;
r) REPO=${OPTARG};;
p) PROJECT=${OPTARG};;
\?)
    echo "Invalid option: -$OPTARG" >&2
    exit 1
    ;;
esac
done

echo "start chaincode update on peer for chain code" $CHAINCODE_NAME "version" $VNUMBER 
# Check if git is present
command -v git >/dev/null 2>&1 || { 
    echo >&2 "I require git but it's not installed.  Insalling git" 
    apt update && apt install git -y 
}
# Get the news chainecode and delete the old one
rm -rf $PROJECT
git clone -b dev http://read-only-all:GhKgC33RLzuzQP3z6NTC@$REPO

### Install the chaincode on the Peer
mv $PROJECT/chaincode /var/hyperledger/chaincode$VNUMBER
peer chaincode install -l node -n $CHAINCODE_NAME -v $VNUMBER -p /var/hyperledger/chaincode$VNUMBER
