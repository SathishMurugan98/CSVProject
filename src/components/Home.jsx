import React, { Component } from 'react';
import * as XLSX from "xlsx";
import './styles.css';
import $ from "jquery";
import axios from "axios";

export default class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      excelData: [],
      message: "",
      error: false,
      success: false,
    }
  }

  excelToJson(reader, fileName) {
    var fileData = reader.result;
    var wb = XLSX.read(fileData, { type: "binary" });
    var data = {};
    var data1 = [];
    wb.SheetNames.forEach(function (sheetName) {
      var rowObj = XLSX.utils.sheet_to_row_object_array(wb.Sheets[sheetName]);
      var rowString = JSON.stringify(rowObj);
      data[sheetName] = rowString;
      data1 = rowObj;
    });
    this.uploadFile(fileName, data1);
    if (data1.length !== 0) {
      console.log(fileName, "###########", data1);
      $("#tableDet").css("display", "block");
      let keys = Object.keys(data1[0]);
      keys.unshift("S.NO");
      let theader = "";
      for (let i = 0; i < keys.length; i++) {
        theader += "<th>" + keys[i].toString() + "</th>"
      }
      console.log("theader---->", keys);
      $("#table thead").append("<tr>" + theader + "</tr>")
      for (let i = 0; i < data1.length; i++) {
        let values = Object.values(data1[i]);
        let tbody = "";
        tbody += "<td>" + (i + 1) + "</td >";
        for (let j = 0; j < values.length; j++) {
          tbody += "<td>" + values[j].toString() + "</td>"
        }
        $("#table tbody").append("<tr>" + tbody + "</tr >")
      }

    }
  }

  loadFileXLSX(event) {
    var input = event.target;
    var reader = new FileReader();
    if (input.files[0] !== undefined) {
      reader.onload = this.excelToJson.bind(this, reader, input.files[0].name);
      reader.readAsBinaryString(input.files[0]);
    }
  }

  uploadFile(name, data1) {
    const form = document.querySelector("form");
    const progressArea = document.querySelector(".progress-area");
    const uploadedArea = document.querySelector(".uploaded-area");
    $(".progress-area").empty()
    $(".uploaded-area").empty()
    $("#tableDet tbody").empty();
    $("#tableDet thead").empty();
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "");
    xhr.upload.addEventListener("progress", ({ loaded, total }) => {
      let fileLoaded = Math.floor((loaded / total) * 100);
      let fileTotal = Math.floor(total / 1000);
      let fileSize;
      fileTotal < 1024
        ? (fileSize = fileTotal + " KB")
        : (fileSize = (loaded / (1024 * 1024)).toFixed(2) + " MB");
      let progressHTML = `<li class="row">
                            <i class="fas fa-file-alt"></i>
                            <div class="content">
                              <div class="details">
                                <span class="name">${name}</span>
                                <span class="percent">${fileLoaded}%</span>
                              </div>
                              <div class="progress-bar">
                                <div class="progress" style="width: ${fileLoaded}%"></div>
                              </div>
                            </div>
                          </li>`;
      uploadedArea.classList.add("onprogress");
      progressArea.innerHTML = progressHTML;
      if (loaded === total) {
        progressArea.innerHTML = "";
        let uploadedHTML = `<li class="row">
                              <div class="content upload">
                                <div style="display:flex;">
                                  <i class="fas fa-file-alt"></i>
                                  <div class="details">
                                    <span class="name">${name}</span>
                                    <span class="size">${fileSize}</span>
                                  </div>
                                </div>
                                <div>
                                  <i class="fas fa-check"></i>
                                </div>
                              </div>
                            </li>
                          <div id="close_icon" class="icons" title="close" >
                            <span>X</span>
                          </div>
                          <div id="submit_icon" class="icons" title="submit" >
                            <span><i class="fas fa-file-upload"></i></span>
                          </div>`;
        uploadedArea.classList.remove("onprogress");
        uploadedArea.insertAdjacentHTML("afterbegin", uploadedHTML);
        $("#close_icon").on("click", () => this.closeButton());
        $("#submit_icon").on("click", () => this.submitButton(data1));
      }
    });
    let data = new FormData(form);
    xhr.send(data);
  }

  closeButton = () => {
    this.setState({ message: "", error: false, success: false })
    $(".file-input").val("")
    $(".progress-area").empty();
    $(".uploaded-area").empty();
    $("#tableDet tbody").empty();
    $("#tableDet thead").empty();
    $("#tableDet").css("display", "none");
    // this.deleting();
  }

  submitButton = (data1) => {
    axios({ method: "POST", url: "/api/asset", data: data1 })
      .then((response) => {
        console.log("---->", response);
        if (response.status === 200) {
          $(".file-input").val("")
          $(".progress-area").empty();
          $(".uploaded-area").empty();
          $("#tableDet tbody").empty();
          $("#tableDet thead").empty();
          $("#tableDet").css("display", "none");
          this.displayMsg("Data Uploaded Successfully", false, true)
        } else if (response.status === 208) {
          this.displayMsg("Already MacID Presented", true, false)
        }
      })
      .catch((error) => {
        console.log("=======>", error);
        if (error.response.status === 400) {
          this.displayMsg("Bad Request", true, false)
        } else {
          this.displayMsg("Request Failed With Code " + error.response.status, true, false)
        }
      })
  }

  displayMsg = (msg, error, success) => {
    clearTimeout(this.timeout);
    this.setState({ message: msg, error: error, success: success })
    this.timeout = setTimeout(() => {
      this.setState({ message: "", error: false, success: false })
    }, 4000);
  }



  // deleting = () => {
  //   console.log("-------->DELETing-------->");
  //   var deleteBox = '<span class="deleteBox"><p>Are you sure you want to delete?</p><span class="cancel">Cancel</span><span class="confirm">Yes</span></span>';
  //   $('.delete').append(deleteBox);
  //   if (!$('.delete').hasClass('selected')) {
  //     $('.delete').addClass('selected');
  //     var owner = $('.delete');

  //     $('.delete > .deleteBox > .cancel').on('click', function () {
  //       console.log("cancel")
  //       owner.removeClass('selected');
  //       return false;
  //     })

  //     $('.delete').find('.confirm').on('click', function () {
  //       $('.delete').parent().addClass('loading');
  //       var parent = $('.delete').parent();

  //       setTimeout(function () { //On success
  //         parent.addClass('deleted');
  //         setTimeout(function () {
  //           owner.fadeOut(600);
  //           setTimeout(function () {
  //             owner.find('.deleted').removeClass('loading').removeClass('deleted');
  //             owner.removeClass('selected');
  //             owner.show();
  //           }, 1000)
  //         }, 1000)
  //       }, 1000)

  //       return false;
  //     })
  //   }
  //   return false;

  // }

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    const { message, error } = this.state;
    return (
      <div>
        <div className='maindiv'>
          <div className='icondiv'>
            <img src='/images/Logo.png' alt=""
              style={{ width: "130px", marginTop: '20px' }} />
          </div>
          
          <div style={{ display: "flex", marginTop: "65px", justifyContent: "space-evenly" }}>
            <div>
              {message.length > 0 && (
                <div className="row" id="msgblock" style={{ margin: "0px" }}>
                  <div className={error === true ? "alert alert-danger" : "alert alert-success"} role="alert">
                    {message}
                  </div>
                </div>
              )}
              <div className='uploaddiv'>
                <img src='/images/upload.png' alt='' /> <br />
                <div style={{ marginTop: '20px' }} className='uploaddivbtn'>
                  <form>
                    <input className="file-input"
                      required
                      accept=".xlsx, .xls, .csv"
                      type="file"
                      name="file"
                      onChange={this.loadFileXLSX.bind(this)}
                    />
                  </form>
                  <section className="progress-area"></section>
                  <section className="uploaded-area"></section>
                </div>
              </div>
            </div>
            <div id="tableDet" style={{
              width: "430px",
              maxHeight: "315px",
              display: "none",
              overflowY: "scroll"
            }}>
              <table id="table">
                <thead></thead>
                <tbody></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }
}





