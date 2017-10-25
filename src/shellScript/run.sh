#! /bin/bash

foldername="testcode" # checked: searching 'testcode', changing naming
fs_count=$(ls -Rl $TARGET | grep ^-|wc -l) # checked: $TARGET?

# checked: -m?
set -m

echo "analysis start..."

# foldername에 있는 모든 file을 실행한다.
# analysis.sh는 어디에?
for LINE in `ls $foldername`
do
        /bin/bash analysis.sh $foldername'/'$LINE &
done

# wait all background process.
wait
#while [ 1 ]; do fg 2> /dev/null; [ $? == 1 ] && break; done

# what is metricData?
rm metricData.*
echo "analysis complete"

echo "codeCopy check start..."

# why move moss.pl to foldername?
# what is moss.pl?
# why re move moss.pl to original dir?
mv moss.pl $foldername
cd $foldername
./moss.pl -l python *.py
mv moss.pl ../
