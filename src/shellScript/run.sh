#! /bin/bash

foldername="testcode"
fs_count=$(ls -Rl $TARGET | grep ^-|wc -l)

set -m

echo "analysis start..."

for LINE in `ls $foldername`
do
        /bin/bash analysis.sh $foldername'/'$LINE &
done

wait
#while [ 1 ]; do fg 2> /dev/null; [ $? == 1 ] && break; done

rm metricData.*
echo "analysis complete"

echo "codeCopy check start..."

mv moss.pl $foldername
cd $foldername
./moss.pl -l python *.py
mv moss.pl ../