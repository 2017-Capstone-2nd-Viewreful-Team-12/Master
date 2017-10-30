import os
import sys
from collections import OrderedDict
import json
import re

PATH_SEPERATOR = '/'
RESULT_DIR = './result'
ERR_DATA_PATH = './error_py.dat'
analysis_rules = ['indentation', 'naming', 'comment', 'white space', \
            'code format', 'statement', 'function', 'class', 'module']


def code_analyzer(src_path, src_name):
    # import error data
    total_errs_dict = OrderedDict()
    with open(ERR_DATA_PATH, 'r') as f:
        for rule in analysis_rules:
            total_errs_dict[rule] = list()
            line = f.readline().split()
            for err_code in line:
                total_errs_dict[rule].append(err_code)

    # create result directory
    if (not os.path.isdir(RESULT_DIR)):
        os.mkdir(RESULT_DIR)

    # temp file to store semi-result about python tools
    src_path = src_path + PATH_SEPERATOR + src_name
    res_src_path = RESULT_DIR + PATH_SEPERATOR + src_name
    outfilename = res_src_path + '.txt'

    # run python static analysis tools (pycodestyle, pylint)
    cmd = 'pycodestyle {_file} --format="%(code)s %(row)d %(col)d" > {_outfile}'.format(_file=src_path, _outfile=outfilename)
    os.system(cmd)
    cmd = 'pylint --msg-template="{{msg_id}} {{line:3d}} {{column}}" --reports=n {_file} >> {_outfile}'.format(_file=src_path, _outfile=outfilename)
    os.system(cmd)

    # analysis the result
    codestyle_lint_json = OrderedDict()
    for rule in analysis_rules:
        codestyle_lint_json[rule] = list()

    with open(outfilename, 'r') as f:
        for line in f.readlines():
            info = line.split() # info: code, row, col
            if (len(info) != 3):
                continue

            for rule in analysis_rules:
                for err_code in total_errs_dict[rule]:
                    if (info[0] == err_code):
                        for i in range(len(codestyle_lint_json[rule])):
                            if (err_code in codestyle_lint_json[rule][i]):
                                codestyle_lint_json[rule][i][err_code] += 1
                                break
                        else:
                            codestyle_lint_json[rule].append({'{_code}'.format(_code=err_code): 1})
                        break
                else:
                    continue
                break

    # run python static analysis tool (pymetrics)
    cmd = 'pymetrics -z {_file} > {_outfile}'.format(_file=src_path, _outfile=outfilename)
    os.system(cmd)

    metrics_json = OrderedDict()
    metrics_json["_id"] = '{_file}'.format(_file=src_name)
    with open(outfilename, 'r') as f:
        reg_ex = re.compile('^[0-9]+$') # only digits
        for line in f.readlines():
            info = line.split() # info: count, category
            if (len(info) != 2):
                continue

            if (reg_ex.match(info[0])):
                metrics_json[info[1]] = info[0]

    metrics_json.update(codestyle_lint_json)
    with open('{_path}.json'.format(_path=res_src_path), 'w', encoding='utf-8') as f:
        json.dump(metrics_json, f, ensure_ascii=False, indent='\t')

    # import json to DB
    cmd = 'mongoimport --db test --collection docs --file {_filename}.json'.format(_filename=src_name)
    # os.system(cmd)

    # remove temp file
    os.remove(outfilename)
    os.system('rm metricData.*')
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
            code_analyzer(sys.argv[1], code)
    print('analysis finished')

    print('code copy check start')
    cmd = './moss.pl -l python {_dir}/*.py'.format(_dir=sys.argv[1])
    # os.system(cmd)
    print('code copy check finished')
    pass
