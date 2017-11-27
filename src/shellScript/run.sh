#! /bin/bash

foldername="testcode" # checked: searching 'testcode', changing naming
fs_count=$(ls -Rl $TARGET | grep ^-|wc -l) # checked: $TARGET?

# checked: -m?
set -m

echo "analysis start..."

# checked: foldername에 있는 모든 file을 실행한다.
# checked: analysis.sh는 어디에?
for LINE in `ls $foldername`
do
        /bin/bash analysis.sh $foldername'/'$LINE &
done

# checked: wait all background process.
wait
#while [ 1 ]; do fg 2> /dev/null; [ $? == 1 ] && break; done

# checked: what is metricData?
rm metricData.*
echo "analysis complete"

echo "codeCopy check start..."

# checked: why move moss.pl to foldername?
# checked: what is moss.pl?
# checked: why re move moss.pl to original dir?
mv moss.pl $foldername
cd $foldername
./moss.pl -l python *.py
mv moss.pl ../
