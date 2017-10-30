import os
import sys
import subprocess

RESULT_DIR ='./result'
PATH_SEPERATOR '/'


def code_analyzer(codename):
	# import error data
	# source /home/kdwhan27/iw_shell/python/error.dat

	if (not os.path.isdir(RESULT_DIR)):
		os.mkdir(RESULT_DIR)
	
	outfilename = RESULT_DIR + PATH_SEPERATOR + codename

	



if __name__ == "__main__":
	if (len(sys.argv) != 2):
		print('error: invalid argument #')
		print('\tpython {_program_name} TARGET_CODE_DIR'.format(_program_name=sys.argv[0]))
		sys.exit(1)

	print('analysis start')

	codes = os.listdir(sys.argv[1])
	for code in codes:
		# /bin/bash analysis.sh sys.argv[1]+code &
