import os
import sys
from collections import OrderedDict
import json
import re

PATH_SEPERATOR = '/'
RESULT_DIR = './result'
ERR_DATA_PATH = './error_py.dat'
ANALYSIS_RULES = ['indentation', 'naming', 'comment', 'white space', \
      'code format', 'statement', 'function', 'class', 'module']

class CodeAnalyzer:
  def __init__(self):
    # create result directory
    if (not os.path.isdir(RESULT_DIR)):
      os.mkdir(RESULT_DIR)

    # variable initialization
    self.src_path = ''
    self.src_name = ''
    self.res_src_path = ''
    self.out_file_name = ''

    # import error data
    self.errs_dict = OrderedDict()
    with open(ERR_DATA_PATH, 'r') as f:
      for rule in ANALYSIS_RULES:
        self.errs_dict[rule] = list()
        line = f.readline().split()
        for err_code in line:
          self.errs_dict[rule].append(err_code)
    pass

  def execute_cmd(self, cmd):
    os.system(cmd)
    pass

  def run_pycodestyle_pylint(self):
    self.execute_cmd('pycodestyle {_file} --format="%(code)s %(row)d %(col)d" > {_outfile}'.format(_file=self.src_path, _outfile=self.out_file_name))

    self.execute_cmd('pylint --msg-template="{{msg_id}} {{line:3d}} {{column}}" --reports=n {_file} >> {_outfile}'.format(_file=self.src_path, _outfile=self.out_file_name))

    # analyze the result
    self.codestyle_lint_json = OrderedDict()
    for rule in ANALYSIS_RULES:
      self.codestyle_lint_json[rule] = OrderedDict()
      self.codestyle_lint_json[rule]['count'] = 0
      self.codestyle_lint_json[rule]['error'] = list()

    with open(self.out_file_name, 'r') as f:
      for line in f.readlines():
        info = line.split() # info: code, row, col
        if (len(info) != 3):
          continue

        for rule in ANALYSIS_RULES:
          for err_code in self.errs_dict[rule]:
            if (info[0] == err_code):
              self.codestyle_lint_json[rule]['count'] += 1
              self.codestyle_lint_json[rule]['error'].append({"name": info[0], "row": info[1], "col": info[2]})
              break
          else:
            continue
          break
    return self.codestyle_lint_json

  def run_pymetrics(self):
    # run python static analysis tool (pymetrics)
    self.execute_cmd('pymetrics -z {_file} > {_outfile}'.format(_file=self.src_path, _outfile=self.out_file_name))

    self.metrics_json = OrderedDict()
    self.metrics_json["_id"] = '{_file}'.format(_file=self.src_name)
    with open(self.out_file_name, 'r') as f:
      reg_ex = re.compile('^[0-9]+$') # only digits
      for line in f.readlines():
        info = line.split() # info: count, category
        if (len(info) != 2):
          continue

        if (reg_ex.match(info[0])):
          self.metrics_json[info[1]] = info[0]

    return self.metrics_json

  def analyze(self, src_path, src_name):
    # temp file to store semi-result about python tools
    self.src_path = os.path.join(src_path, src_name)
    self.src_name = src_name
    self.res_src_path = os.path.join(RESULT_DIR, src_name)
    self.out_file_name = self.res_src_path + '.txt'

    # run python static analysis tools (pycodestyle, pylint)
    self.result_json = self.run_pymetrics().update(self.run_pycodestyle_pylint())

    with open('{_path}.json'.format(_path=self.res_src_path), 'w', encoding='utf-8') as f:
      json.dump(self.metrics_json, f, ensure_ascii=False, indent='\t')

    # import json to DB
    # self.execute_cmd('mongoimport --db test --collection docs --file {_filename}.json'.format(_filename=src_name))

    # remove temp file
    os.remove(self.out_file_name)
    os.system('rm metricData.*')
    pass

if __name__ == '__main__':
  # check execution argument type
  if (len(sys.argv) != 2):
    print('error: invalid argument #')
    print('\tpython3 {_program_name} TARGET_CODE_DIR'.format(_program_name=sys.argv[0]))
    sys.exit(1)

  c = CodeAnalyzer()
  # get file(src code) list of current directory
  for path, _, codes in os.walk(sys.argv[1]):
    for code in codes:
      ext = os.path.splitext(code)[-1]
      if (ext == '.py'):
        c.analyze(path, code)

  # task: code copy check
  # c.execute_cmd('./moss.pl -l python {_dir}/*.py'.format(_dir=sys.argv[1]))

  pass
