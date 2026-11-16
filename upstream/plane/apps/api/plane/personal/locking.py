"""Serialize local requests and offline maintenance across Windows processes."""

from contextlib import contextmanager
from threading import RLock, local

from django.conf import settings

_thread_lock = RLock()
_state = local()


@contextmanager
def data_lock():
    with _thread_lock:
        if getattr(_state, "held", False):
            yield
            return
        with (settings.DATA_ROOT / ".personal-data.lock").open("a+b") as lock_file:
            if lock_file.tell() == 0:
                lock_file.write(b"0")
                lock_file.flush()
            lock_file.seek(0)
            try:
                import msvcrt
            except ImportError:
                import fcntl

                fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)

                def release():
                    fcntl.flock(lock_file.fileno(), fcntl.LOCK_UN)
            else:
                msvcrt.locking(lock_file.fileno(), msvcrt.LK_LOCK, 1)

                def release():
                    msvcrt.locking(lock_file.fileno(), msvcrt.LK_UNLCK, 1)

            _state.held = True
            try:
                yield
            finally:
                _state.held = False
                lock_file.seek(0)
                release()
