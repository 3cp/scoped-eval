## [0.4.3](https://github.com/3cp/scoped-eval/compare/v0.4.2...v0.4.3) (2024-12-17)



## [0.4.2](https://github.com/3cp/scoped-eval/compare/v0.4.1...v0.4.2) (2022-04-05)



## [0.4.1](https://github.com/3cp/scoped-eval/compare/v0.4.0...v0.4.1) (2021-08-20)



# [0.4.0](https://github.com/3cp/scoped-eval/compare/v0.3.0...v0.4.0) (2021-08-20)


### Bug Fixes

* bring back unused-name to properly support function scope ([19d56bd](https://github.com/3cp/scoped-eval/commit/19d56bd3e9e37a7faf5264c2abfdc53c00cdd090))


### BREAKING CHANGES

* the built func now has to be called with scope
object as an argument like func(scope). The scope object is not
the "this" object in the function.



# [0.3.0](https://github.com/3cp/scoped-eval/compare/v0.2.2...v0.3.0) (2021-07-24)



## [0.2.2](https://github.com/3cp/scoped-eval/compare/v0.2.1...v0.2.2) (2021-07-12)



## [0.2.1](https://github.com/3cp/scoped-eval/compare/v0.2.0...v0.2.1) (2021-07-09)



# [0.2.0](https://github.com/3cp/scoped-eval/compare/v0.1.0...v0.2.0) (2021-07-09)


### Features

* support string interpolation mode ([f66e885](https://github.com/3cp/scoped-eval/commit/f66e8851afbbf75d7be009f137c4f0535743d671))



# 0.1.0 (2021-07-06)


### Bug Fixes

* fix unused-name missed checking on local variables ([b521b6d](https://github.com/3cp/scoped-eval/commit/b521b6d9007430099e1ee50b1149e0351b7bd58a))


### Features

* reject dynamic import ([5fed1ab](https://github.com/3cp/scoped-eval/commit/5fed1abe54fce0ab4a3e0c4fb7ecd760a0b4870a))
* scope ([2ae8d32](https://github.com/3cp/scoped-eval/commit/2ae8d3296d616fb5675f68872e13733486fba686))




