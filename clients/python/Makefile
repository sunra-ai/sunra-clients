MAKEFILE_DIR := $(patsubst %/,%,$(dir $(abspath $(lastword $(MAKEFILE_LIST)))))

SPHINXOPTS    = --fresh-env
SPHINXBUILD   = sphinx-build
SPHINXAPIDOC  = sphinx-apidoc
SOURCEDIR     = $(MAKEFILE_DIR)/docs
BUILDDIR      = $(MAKEFILE_DIR)/docs/_build
PROJECTDIR    = $(MAKEFILE_DIR)/src/sunra_client

help:
	@$(SPHINXBUILD) -M help "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

.PHONY: help Makefile clean apidoc html docs

clean:
	rm -rf $(BUILDDIR)/*

apidoc:
	$(SPHINXAPIDOC) -f -o "$(SOURCEDIR)" "$(PROJECTDIR)"

html:
	@$(SPHINXBUILD) -M html "$(SOURCEDIR)" "$(BUILDDIR)" $(SPHINXOPTS) $(O)

docs: apidoc html

.PHONY: test
test:
	python -m pytest tests/

.PHONY: lint
lint:
	ruff check .

.PHONY: format
format:
	ruff format .

.PHONY: lint-fix
lint-fix:
	ruff check --fix .
