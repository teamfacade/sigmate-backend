#!/bin/bash

KEY_DIR="keys"
ECPARAM_NAME=prime256v1
SECRET_KEY_PATH="$KEY_DIR/private-key.pem"
PUBLIC_KEY_PATH="$KEY_DIR/public-key.pem"
CERT_PATH="$KEY_DIR/cert.pem"
CNF_DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OVERWRITE=0

function stop() {
    echo "ERROR: $1"
    exit
}

# Check openssl exists
openssl version > /dev/null
if [[ $? -ne 0 ]]; then
    stop "openssl not found"
fi

# Confirm that curve is supported
openssl ecparam -list_curves | grep $ECPARAM_NAME > /dev/null
if [[ $? -ne 0 ]]; then
    stop "$ECPARAM_NAME curve not available"
fi

# Check key directory
if [[ ! -d $KEY_DIR ]]; then
    mkdir keys || stop "Cannot create directory at '$KEY_DIR'"
    OVERWRITE=1
fi

# Generate private key
if [[ OVERWRITE -eq 1 || ! -f $SECRET_KEY_PATH ]]; then
    openssl ecparam -name prime256v1 -genkey -noout -out $SECRET_KEY_PATH || stop "Secret key generation failed"
    OVERWRITE=1
fi

# Generate public key from private key
if [[ OVERWRITE -eq 1 || ! -f $PUBLIC_KEY_PATH ]]; then
    openssl ec -in $SECRET_KEY_PATH -pubout -out $PUBLIC_KEY_PATH || stop "Public key generation failed"
    OVERWRITE=1
fi

# Generate certificate from private key
if [[ OVERWRITE -eq 1 || ! -f $CERT_PATH ]]; then
    openssl req -new -x509 -key $SECRET_KEY_PATH -out $CERT_PATH -config "$CNF_DIR/sigmate.cnf" || stop "Certificate generation failed"
    OVERWRITE=1
fi
