
CORE_PEER_MSPCONFIGPATH=/var/hyperledger/admin_msp # Select the right path for the admin msp

# Parse args
while getopts "v:c:r:p:m:" option
do
case "${option}"
in
v) VNUMBER=${OPTARG};;
c) CHAINCODE_NAME=${OPTARG};;
r) REPO=${OPTARG};;
p) PROJECT=${OPTARG};;
m) MODE=${OPTARG};;
\?)
    echo "Invalid option: -$OPTARG" >&2
    exit 1
    ;;
esac
done
 
if [[ $MODE == "i" ]]; 
then 
       JSON_SCRIPT=''"'"'{"Args":["init", "'"$CHAINCODE_NAME"'"]}'"'"''
       peer chaincode instantiate -C $CHANNEL_NAME -l node -n $CHAINCODE_NAME -v $VNUMBER -c $JSON_SCRIPT -P "AND ('PeerMSP.member')" 
else
       peer chaincode upgrade -C $CHANNEL_NAME -l node -n $CHAINCODE_NAME -v $VNUMBER -c '{"Args":[""]}' -P "AND ('PeerMSP.member')" 
fi
