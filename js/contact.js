(function () {
  var form = document.querySelector(".form");
  if (!form) return;

  var box = form.closest(".block--form");
  var done = box.querySelector(".form-done");
  var status = form.querySelector(".form-status");
  var btn = form.querySelector(".send");
  var label = btn.textContent;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    status.textContent = "";
    status.classList.remove("is-error");
    btn.disabled = true;
    btn.textContent = "Sending…";

    fetch(form.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    })
      .then(function (r) {
        return r.json().then(function (d) { return { ok: r.ok && d.success, data: d }; });
      })
      .then(function (res) {
        if (!res.ok) throw new Error("send failed");
        // keep the box the same height so the page doesn't jump
        box.style.minHeight = box.offsetHeight + "px";
        form.hidden = true;
        done.hidden = false;
        done.focus();
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = label;
        status.classList.add("is-error");
        status.innerHTML = 'Something went wrong. Try again, or email <a href="mailto:einar.lundqvist@gmail.com">einar.lundqvist@gmail.com</a>.';
      });
  });
})();
