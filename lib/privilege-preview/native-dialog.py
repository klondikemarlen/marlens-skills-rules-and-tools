#!/usr/bin/python3
"""Render one validated privilege request; authentication belongs to polkit."""

import json
import os
import shlex
import sys

MAX_MESSAGE_BYTES = 131072
FINAL_RESULTS = {
    "command-completed", "authorization-or-command-failed", "error",
    "cancelled", "expired", "interrupted", "demo-completed",
}


def read_initial_message():
    pending = bytearray()
    while b"\n" not in pending:
        chunk = os.read(sys.stdin.fileno(), 4096)
        if not chunk:
            raise ValueError("Parent closed stdin before the request was complete")
        pending.extend(chunk)
        if len(pending) > MAX_MESSAGE_BYTES:
            raise ValueError("Request exceeds the native dialog message limit")

    line, remainder = bytes(pending).split(b"\n", 1)
    message = json.loads(line)
    if not isinstance(message, dict):
        raise ValueError("Expected a request envelope")
    if not isinstance(message.get("demo"), bool):
        raise ValueError("Expected an explicit demo flag")
    expiry = message.get("expiresInSeconds")
    if type(expiry) is not int or not 30 <= expiry <= 900:
        raise ValueError("Expiry must be an integer from 30 to 900 seconds")
    request = message.get("request")
    if not isinstance(request, dict):
        raise ValueError("Expected a validated request")
    return message, remainder


def main():
    if os.geteuid() == 0:
        print("privilege-preview: the native dialog must not run as root", file=sys.stderr)
        return 1

    try:
        import gi

        gi.require_version("Gtk", "4.0")
        gi.require_version("Adw", "1")
        from gi.repository import Adw, Gdk, Gio, GLib, Gtk, Pango

        if not Gtk.init_check():
            raise RuntimeError("A working graphical display is required")
        envelope, pending = read_initial_message()
    except (ImportError, ValueError, RuntimeError, OSError) as error:
        print(f"privilege-preview: native dialog startup failed: {error}", file=sys.stderr)
        return 1

    class PrivilegeDialog:
        def __init__(self):
            self.request = envelope["request"]
            self.demo = envelope["demo"]
            self.pending = bytearray(pending)
            self.parent_pid = os.getppid()
            self.state = "starting"
            self.exit_code = 0
            self.window = None
            self.application = Adw.Application(
                application_id="org.omp.PrivilegePreview",
                flags=Gio.ApplicationFlags.NON_UNIQUE,
            )
            self.application.connect("activate", self.activate)

        def emit(self, result):
            try:
                print(json.dumps({"result": result}), flush=True)
                return True
            except (BrokenPipeError, OSError):
                self.quit()
                return False

        def quit(self):
            self.state = "finished"
            self.application.quit()

        def fail(self, message):
            print(f"privilege-preview: {message}", file=sys.stderr)
            self.exit_code = 1
            self.quit()

        def finish(self, result):
            if self.state != "waiting":
                return
            self.state = "finished"
            self.emit(result)
            self.application.quit()

        def cancel(self, *_arguments):
            self.finish("cancelled")

        def close_requested(self, *_arguments):
            self.cancel()
            return True

        def key_pressed(self, _controller, keyval, _keycode, _modifiers):
            if keyval == Gdk.KEY_Escape:
                self.cancel()
                return True
            return False

        def expire(self):
            self.finish("expired")
            return GLib.SOURCE_REMOVE

        def approve(self, *_arguments):
            if self.state != "waiting":
                return
            if self.demo:
                self.finish("demo-completed")
                return

            self.state = "approved"
            self.cancel_button.set_sensitive(False)
            self.continue_button.set_sensitive(False)
            self.header.set_show_end_title_buttons(False)
            self.status.set_label(
                "Waiting for system authentication and command completion. "
                "Only the system authentication dialog can ask for your password."
            )
            self.emit("approved")

        def text(self, value, style=None):
            widget = Gtk.Label(label=value, xalign=0, wrap=True, selectable=True)
            widget.set_use_markup(False)
            widget.set_wrap_mode(Pango.WrapMode.WORD_CHAR)
            widget.set_max_width_chars(60)
            if style:
                widget.add_css_class(style)
            return widget

        def section(self, container, title, value):
            container.append(self.text(title, "heading"))
            container.append(self.text(value))

        def activate(self, application):
            try:
                self.build_window(application)
                os.set_blocking(sys.stdin.fileno(), False)
                GLib.io_add_watch(
                    sys.stdin.fileno(),
                    GLib.IO_IN | GLib.IO_HUP | GLib.IO_ERR | GLib.IO_NVAL,
                    self.parent_message,
                )
                GLib.timeout_add_seconds(1, self.check_parent)
                GLib.timeout_add_seconds(envelope["expiresInSeconds"], self.expire)
                self.state = "waiting"
                self.window.present()
                if not self.emit("ready"):
                    return
                if self.pending:
                    self.consume_messages()
            except (KeyError, TypeError, ValueError, RuntimeError, OSError) as error:
                self.fail(f"Cannot show the native request: {error}")

        def build_window(self, application):
            request = self.request
            context = request["context"]
            command = request["command"]
            targets = request["target"]
            self.window = Adw.ApplicationWindow(
                application=application,
                title=targets[0]["value"],
                default_width=580,
                default_height=650,
            )
            self.window.update_property(
                [Gtk.AccessibleProperty.LABEL], [targets[0]["value"]]
            )
            self.window.connect("close-request", self.close_requested)
            keys = Gtk.EventControllerKey()
            keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
            keys.connect("key-pressed", self.key_pressed)
            self.window.add_controller(keys)

            toolbar = Adw.ToolbarView()
            self.header = Adw.HeaderBar()
            toolbar.add_top_bar(self.header)
            content = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
            for side in ("top", "bottom", "start", "end"):
                getattr(content, "set_margin_" + side)(24)

            content.append(self.text("Demo · No authentication or execution" if self.demo
                                     else "Administrator access requested", "dim-label"))
            content.append(self.text(targets[0]["value"], "title-1"))
            self.section(content, "What happened", context["whatHappened"])
            self.section(content, "Why administrator access is needed", request["reason"])
            if context.get("repository"):
                self.section(content, "Project", context["repository"])
            for target in targets[1:]:
                self.section(content, target["label"], target["value"])

            details = Gtk.Expander(label="Details")
            detail_content = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=10)
            detail_content.set_margin_top(12)
            self.section(detail_content, "Exact command (quoted arguments)",
                         shlex.join([command["executable"], *command["arguments"]]))
            self.section(detail_content, "Working directory", command["cwd"])
            self.section(detail_content, "User goal", context["task"])
            self.section(detail_content, "Intended effect", context["completionEffect"])
            self.section(detail_content, "Requested by", context["agent"])
            detail_content.append(self.text(
                "Runs as administrator (root), for this command only. "
                "The command and arguments above are passed directly, not to a shell.",
                "dim-label",
            ))
            details.set_child(detail_content)
            content.append(details)

            self.status = self.text(
                "This demo ends when you choose Try Continue. No password or command follows."
                if self.demo else
                "Continue hands this exact command to the system for authentication. "
                "This window does not collect passwords.",
                "dim-label",
            )
            content.append(self.status)
            content.append(self.text(
                f"This request expires after {envelope['expiresInSeconds']} seconds.",
                "dim-label",
            ))
            scroller = Gtk.ScrolledWindow(
                hscrollbar_policy=Gtk.PolicyType.NEVER,
                vscrollbar_policy=Gtk.PolicyType.AUTOMATIC,
                vexpand=True,
            )
            scroller.set_child(content)
            toolbar.set_content(scroller)

            actions = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=12,
                              halign=Gtk.Align.END)
            for side in ("top", "bottom", "start", "end"):
                getattr(actions, "set_margin_" + side)(12)
            self.cancel_button = Gtk.Button(label="Cancel")
            self.cancel_button.connect("clicked", self.cancel)
            self.continue_button = Gtk.Button(label="Try Continue" if self.demo else "Continue")
            self.continue_button.add_css_class("suggested-action")
            self.continue_button.connect("clicked", self.approve)
            actions.append(self.cancel_button)
            actions.append(self.continue_button)
            toolbar.add_bottom_bar(actions)
            self.window.set_content(toolbar)
            self.cancel_button.grab_focus()

        def consume_messages(self):
            if len(self.pending) > MAX_MESSAGE_BYTES:
                self.fail("Parent message exceeds the native dialog limit")
                return False
            while b"\n" in self.pending:
                line, remainder = self.pending.split(b"\n", 1)
                self.pending = bytearray(remainder)
                try:
                    message = json.loads(line)
                except (ValueError, UnicodeDecodeError):
                    self.fail("Parent sent an invalid completion message")
                    return False
                if (not isinstance(message, dict)
                        or not isinstance(message.get("result"), str)
                        or message["result"] not in FINAL_RESULTS):
                    self.fail("Parent sent an unexpected completion message")
                    return False
                self.quit()
                return False
            return True

        def parent_message(self, descriptor, condition):
            if condition & (GLib.IO_ERR | GLib.IO_NVAL):
                self.quit()
                return GLib.SOURCE_REMOVE
            try:
                chunk = os.read(descriptor, 4096)
            except BlockingIOError:
                return GLib.SOURCE_CONTINUE
            except OSError:
                self.quit()
                return GLib.SOURCE_REMOVE
            if not chunk:
                self.quit()
                return GLib.SOURCE_REMOVE
            self.pending.extend(chunk)
            if not self.consume_messages():
                return GLib.SOURCE_REMOVE
            return GLib.SOURCE_CONTINUE

        def check_parent(self):
            if self.state == "finished":
                return GLib.SOURCE_REMOVE
            if os.getppid() != self.parent_pid:
                self.quit()
                return GLib.SOURCE_REMOVE
            return GLib.SOURCE_CONTINUE

        def run(self):
            application_status = self.application.run([])
            return self.exit_code or application_status

    return PrivilegeDialog().run()


if __name__ == "__main__":
    sys.exit(main())
