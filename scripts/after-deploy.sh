#!/bin/bash
REPOSITORY=/home/ec2-user/build

cd $REPOSITORY

sudo yarn

sudo pm2 start dist
