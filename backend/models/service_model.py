"""Clinic service queries. This file talks to SQLite and does not know about HTTP."""

from db.dbhelper import addrecord, getall


def list_services():
    return getall("services")


def add_service(**fields):
    return addrecord("services", **fields)
