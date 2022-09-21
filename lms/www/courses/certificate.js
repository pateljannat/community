frappe.ready(() => {

    get_canvas();

    $("#export-as-png").click((e) => {
        download_as_png();
    });

    $("#export-as-pdf").click((e) => {
        download_as_pdf();
    });

});


const load_certificate = () => {
    frappe.call({
        method: "lms.lms.doctype.lms_certificate.lms_certificate.generate_image",
        args: {
            "name": $("#certificate-parent").data("name")
        },
        callback: (data) => {
            $("#certificate-parent").html(data.message)
        }
    });
};


const get_canvas = () => {
    html2canvas(document.querySelector('#certificate-card'), {
        scrollY: -window.scrollY,
        scrollX: 0
    }).then((canvas) => {
        canvas.toBlob((blob) => {
            let url = URL.createObjectURL(blob);
            $("#certificate-parent").html(`
                <img width=100 height=100 id="certificate-image" src="${url}"></img>
                <div>${url}</div>
            `);
            $("#certificate-html").addClass("hide");
        });
    })
};


const download_as_png = () => {
    let a = document.createElement('a');
    a.href = $("#certificate-image").attr("src");
    a.download = $("#cta-parent").data("certificate-name") + ".pdf";
    a.click();
};


const download_as_pdf = (canvas) => {
    let xhr = new XMLHttpRequest();
    let formData = new FormData();

    /* formData.append("html", $("#certificate-parent").html());
    var blob = new Blob([], { type: "text/xml"});
    formData.append("blob", blob); */
    formData.append("file_url", $("#certificate-image").attr("src"))
    xhr.open("POST", '/api/method/frappe.handler.download_file');
    xhr.setRequestHeader("X-Frappe-CSRF-Token", frappe.csrf_token);
    xhr.responseType = "arraybuffer";

    xhr.onload = function(success) {
        console.log(success)
        if (this.status === 200) {
            var blob = new Blob([success.currentTarget.response], {type: "application/pdf"});
            var objectUrl = URL.createObjectURL(blob);
            //Open report in a new window
            window.open(objectUrl);
        }
    };
    xhr.send(formData);
};

