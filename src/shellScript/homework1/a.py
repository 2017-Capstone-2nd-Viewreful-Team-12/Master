import os
import sys
from collections import OrderedDict
import json
import re

RESULT_DIR = './result'
PATH_SEPERATOR = '/'
analysis_rules = ['indentation', 'naming', 'comment', 'white space', \
            'code format', 'statement', 'function', 'class', 'module']


def code_analyzer(codename):
    # import error data
    # source /home/kdwhan27/iw_shell/python/error.dat
    rules_dict = OrderedDict()
    with open('./error_py.dat', 'r') as f:
        for rule in analysis_rules:
            rules_dict[rule] = list()
            line = f.readline().split()
            for err_code in line:
                rules_dict[rule].append(err_code)
    # print(json.dumps(rules_dict, ensure_ascii=False, indent='\t'))

    # create result directory
    if (not os.path.isdir(RESULT_DIR)):
        os.mkdir(RESULT_DIR)

    # temp file to store semi-result about python tools
    outfilename = RESULT_DIR + PATH_SEPERATOR + codename + '.txt'

    # run python static analysis tools (pycodestyle, pylint)
    cmd = 'pycodestyle {_file} --format="%(code)s %(row)d %(col)d" > {_outfile}'.format(_file=codename, _outfile=outfilename)
    os.system(cmd)
    cmd = 'pylint --msg-template="{{msg_id}} {{line:3d}} {{column}}" --reports=n {_file} >> {_outfile}'.format(_file=codename, _outfile=outfilename)
    os.system(cmd)

    # analysis the result
    result_dict = OrderedDict()
    for rule in analysis_rules:
        result_dict[rule] = list()

    with open(outfilename, 'r') as f:
        for line in f.readlines():
            info = line.split() # info: code, row, col
            if (len(info) != 3):
                continue

            for rule in analysis_rules:
                for code in rules_dict[rule]:
                    if (info[0] == code):
                        for i in range(len(result_dict[rule])):
                            if (code in result_dict[rule][i]):
                                result_dict[rule][i][code] += 1
                                break
                        else:
                            result_dict[rule].append({'{_code}'.format(_code=code): 1})
                        break
                else:
                    continue
                break

    # run python static analysis tool (pymetrics)
    cmd = 'pymetrics -z {_file} > {_outfile}'.format(_file=codename, _outfile=outfilename)
    os.system(cmd)

    result_json = OrderedDict()
    result_json["_id"] = '{_file}'.format(_file=codename)
    with open(outfilename, 'r') as f:
        reg_ex = re.compile('^[0-9]+$') # only digits
        for line in f.readlines():
            info = line.split() # info: count, category
            if (len(info) != 2):
                continue

            if (reg_ex.match(info[0])):
                result_json[info[1]] = info[0]

    result_json.update(result_dict)
    with open('{_file}.json'.format(_file=codename), 'w', encoding='utf-8') as f:
        json.dump(result_json, f, ensure_ascii=False, indent='\t')
    # with open('{_file}.json'.format(_file=codename), 'a', encoding='utf-8') as f:
    #    json.dump(result_dict, f, ensure_ascii=False, indent='\t')

    # import json to DB
    cmd = 'mongoimport --db test --collection docs --file {_filename}.json'.format(_filename=codename)
    # os.system(cmd)

    # remove temp file
    os.remove(outfilename)
    os.system('rm metricData.*')
    os.rmdir(RESULT_DIR)
    pass


if __name__ == '__main__':
    if (len(sys.argv) != 2):
        print('error: invalid argument #')
        print('\tpython3 {_program_name} TARGET_CODE_DIR'.format(_program_name=sys.argv[0]))
        sys.exit(1)

    print('analysis start')
    codes = os.listdir(sys.argv[1])
    for code in codes:
        ext = os.path.splitext(code)[-1]
        if (ext == '.py'):
            code_analyzer(code)
    print('analysis finished')

    print('code copy check start')
    cmd = './moss.pl -l python {_dir}/*.py'.format(_dir=sys.argv[1])
    os.system(cmd)
    print('code copy check finished')
    pass
