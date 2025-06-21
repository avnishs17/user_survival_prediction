from setuptools import setup,find_packages

with open("requirements.txt") as f:
    requirements = f.read().splitlines()

setup(
    name="titanic_survival_prediction",
    version="0.1",
    author="Avnish",
    packages=find_packages(),
    install_requires = requirements,
)