import test from 'ava';
import parse from '../src/parse';

test('parse returns AST tree from meriyah', t => {
  const code = 'a += 1';
  const expected = {
    "type": "Program",
    "sourceType": "script",
    "body": [
      {
        "type": "ExpressionStatement",
        "expression": {
          "type": "AssignmentExpression",
          "left": {
            "type": "Identifier",
            "name": "a",
            "start": 0,
            "end": 1,
            "range": [
              0,
              1
            ]
          },
          "operator": "+=",
          "right": {
            "type": "Literal",
            "value": 1,
            "start": 5,
            "end": 6,
            "range": [
              5,
              6
            ]
          },
          "start": 0,
          "end": 6,
          "range": [
            0,
            6
          ]
        },
        "start": 0,
        "end": 6,
        "range": [
          0,
          6
        ]
      }
    ],
    "start": 0,
    "end": 6,
    "range": [
      0,
      6
    ]
  };
  t.deepEqual(parse(code) as any, expected);
});

test('parse returns AST tree without parentheses', t => {
  const code = '((b.c))=a';
  const expected = {
    "type": "Program",
    "sourceType": "script",
    "body": [
      {
        "type": "ExpressionStatement",
        "expression": {
          "type": "AssignmentExpression",
          "left": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "b",
              "start": 2,
              "end": 3,
              "range": [
                2,
                3
              ]
            },
            "computed": false,
            "property": {
              "type": "Identifier",
              "name": "c",
              "start": 4,
              "end": 5,
              "range": [
                4,
                5
              ]
            },
            "start": 2,
            "end": 5,
            "range": [
              2,
              5
            ]
          },
          "operator": "=",
          "right": {
            "type": "Identifier",
            "name": "a",
            "start": 8,
            "end": 9,
            "range": [
              8,
              9
            ]
          },
          "start": 0,
          "end": 9,
          "range": [
            0,
            9
          ]
        },
        "start": 0,
        "end": 9,
        "range": [
          0,
          9
        ]
      }
    ],
    "start": 0,
    "end": 9,
    "range": [
      0,
      9
    ]
  };
  t.deepEqual(parse(code) as any, expected);
});

test('parse supports global return', t => {
  const code = 'let b = a + 1; return b;';
  const expected = {
    "type": "Program",
    "sourceType": "script",
    "body": [
      {
        "type": "VariableDeclaration",
        "kind": "let",
        "declarations": [
          {
            "type": "VariableDeclarator",
            "id": {
              "type": "Identifier",
              "name": "b",
              "start": 4,
              "end": 5,
              "range": [
                4,
                5
              ]
            },
            "init": {
              "type": "BinaryExpression",
              "left": {
                "type": "Identifier",
                "name": "a",
                "start": 8,
                "end": 9,
                "range": [
                  8,
                  9
                ]
              },
              "right": {
                "type": "Literal",
                "value": 1,
                "start": 12,
                "end": 13,
                "range": [
                  12,
                  13
                ]
              },
              "operator": "+",
              "start": 8,
              "end": 13,
              "range": [
                8,
                13
              ]
            },
            "start": 4,
            "end": 13,
            "range": [
              4,
              13
            ]
          }
        ],
        "start": 0,
        "end": 14,
        "range": [
          0,
          14
        ]
      },
      {
        "type": "ReturnStatement",
        "argument": {
          "type": "Identifier",
          "name": "b",
          "start": 22,
          "end": 23,
          "range": [
            22,
            23
          ]
        },
        "start": 15,
        "end": 24,
        "range": [
          15,
          24
        ]
      }
    ],
    "start": 0,
    "end": 24,
    "range": [
      0,
      24
    ]
  };
  t.deepEqual(parse(code) as any, expected);
});