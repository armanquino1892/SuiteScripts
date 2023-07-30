/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/render', 'N/record', 'N/ui/serverWidget', 'N/format', 'N/file', 'N/search', 'N/runtime', 'N/email', 'N/config'],
    
    (render, record, serverWidget, format, file, search, runtime, email, config) => {

        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
          var rec = scriptContext.newRecord;
          log.debug('REcord', rec)
          try {
            if(rec.getValue('tranid')) {
            var fileObj = file.load({
                id: 'Vendor Auth Return Files/' + rec.getValue('tranid') + '.pdf'
            });
          }
            
          } catch(error) {
            log.debug('Error', 'File Not Existing')
          }
          
          
        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {
            try {

                var obj = scriptContext.newRecord;

                var vrmaRec = record.load({
                    type: record.Type.VENDOR_RETURN_AUTHORIZATION,
                    id: obj.id
                })
                log.debug('Vendor Return', vrmaRec);

                var vendor = vrmaRec.getText('entity'); 
                log.debug('Vendor', vendor)
                var vendorReturnAuth = vrmaRec.getValue('tranid');
                var memo = vrmaRec.getValue('memo');
                var tranDate = format.format({
                    value: vrmaRec.getValue('trandate'),
                    type: format.Type.DATE
                });

                var subsidiary = vrmaRec.getText('subsidiary');
                var userTotal = vrmaRec.getValue('usertotal');
                var location = vrmaRec.getText('location'); 
                var currency = vrmaRec.getText('currency'); 
                var exchangeRate = vrmaRec.getValue('exchangerate');
                var createdDate = format.format({
                    value: vrmaRec.getValue('custbody_esc_created_date'),
                    type: format.Type.DATE
                });
                var lastModifiedDate = format.format({
                    value: vrmaRec.getValue('custbody_esc_last_modified_date'),
                    type: format.Type.DATE
                });
                var poNotes = vrmaRec.getValue('custbody1');
                var emailToSend = vrmaRec.getValue('custbody9');
                var emailList = emailToSend.split(';').filter(function(x) { return x != ""; });
                
                const info = config.load({type:config.Type.COMPANY_INFORMATION});
                log.debug('Return Email Address', info.getValue('email'));
                var defaultEmailSender = info.getValue('email');
                var currentUser = runtime.getCurrentUser();


                var getItemCount = vrmaRec.getLineCount({
                    sublistId: 'item'
                });

                var xmlStr = "<?xml version=\"1.0\"?>\n" +
                "<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//reportLAP\" \"reportLAP-18.1.dtd\">\n";

                xmlStr += "<pdf>\n<head>";
                xmlStr += '<style type="text/css">';
                xmlStr += 'table { font-size: 8px; } th { font-size: 8px; background-color:#cccccc; padding: 5px 6px 3px;} td { padding: 4px 6px; }';
                xmlStr += 'table.itemtable th { padding-bottom: 10px; padding-top: 10px; }';
                xmlStr += 'table.segmentation { font-size: 8px }';
                xmlStr += 'table.itemtable { font-size: 8px }';
                xmlStr += '</style>';
                xmlStr += '</head>';
                
                xmlStr += '<body padding="0.5in 0.5in 0.5in 0.5in" size="Letter">';
                xmlStr += '<p><span style="font-size:24px"><strong>Vendor Return Authorization</strong></span></p>';
                xmlStr += '<p><strong><span style="font-size:16px">'+ vendorReturnAuth + ' ' + vendor + '</span></strong></p>'
                
                //#region Primary Information Section
                xmlStr += '<table class="primary" align="left" border="0" cellpadding="1" cellspacing="1" style="width:100%">';
                xmlStr += '<tbody>';
                xmlStr += '<tr>'+
                '<td colspan="3" style="background-color:#cccccc; width:341px"><strong>Primary Information</strong></td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td style="width:341px"><b>Vendor</b></td>'+
                '<td style="width:347px"><b>Vendor Return Auth #</b></td>'+
                '<td style="width:492px"><b>Memo</b></td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td style="width:341px">'+ vendor +'</td>'+
                '<td style="width:347px">'+ vendorReturnAuth +'</td>'+
                '<td style="width:492px">'+ memo +'</td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td style="width:341px"><b>Date</b></td>'+
                '<td style="width:347px"><b>Subsidiary</b></td>'+
                '<td style="width:492px"><b>Total</b></td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td style="width:341px">'+ String(tranDate) +'</td>'+
                '<td style="width:347px">'+ subsidiary +'</td>'+
                '<td style="width:492px">'+ userTotal + '</td>'+
                '</tr>';
                xmlStr += '</tbody>';
                xmlStr += '</table>';
                //#endregion

                //#region Segmentation & Transaction Information Section
                xmlStr += '<table class="segmentation" align="left" border="0" cellpadding="1" cellspacing="1" style="width:100%">';
                xmlStr += '<thead>';
                xmlStr += '<tr>'+
                '<th scope="col" style="background-color:#cccccc; text-align:left"><b>Segmentation</b></th>'+
                '<th colspan="2" rowspan="1" scope="col" style="background-color:#cccccc; text-align:left"><b>Transaction Information</b></th>'+
                '</tr>';
                xmlStr += '</thead>'+
                '<tbody>';
                xmlStr += '<tr>'+
                '<td><b>Location</b></td>'+
                '<td><b>Currency</b></td>'+
                '<td><b>Exchange Rate</b></td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td colspan="1" rowspan="3">'+ location +'</td>'+
                '<td>'+ currency +'</td>'+
                '<td>'+ exchangeRate +'</td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td><b>Created Date</b></td>'+
                '<td><b>Last Modified Date</b></td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td>'+ String(createdDate) +'</td>'+
                '<td>'+ String(lastModifiedDate) +'</td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td><b>PO. Notes</b></td>'+
                '</tr>';
                xmlStr += '<tr>'+
                '<td>'+ poNotes +'</td>'+
                '</tr>';
                xmlStr += '</tbody>';
                xmlStr += '</table>';
                //#endregion

                //#region Item Table
                xmlStr += '<table class="itemtable" align="left" style="width:100% margin-top: 10px;">';
                xmlStr += '<thead>';
                xmlStr += '<tr>'+
                '<th >Item</th>'+
                '<th >Description</th>'+
                '<th >Quantity</th>'+
                '<th >Cost</th>'+
                '<th >Ext. Cost</th>'+
                '</tr>';
                xmlStr += '</thead>';
                xmlStr += '<tbody>';

                for(var i = 0; i < getItemCount; i++){

                    var item = vrmaRec.getSublistText({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: i
                    })

                    var itemDesc = vrmaRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'description',
                        line: i
                    })

                    var quantity = vrmaRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: i
                    })

                    var rate = vrmaRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    })

                    var amount = vrmaRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    })

                

                    xmlStr += '<tr>';
                    xmlStr += '<td>'+ item +'</td>';
                    xmlStr += '<td>' + itemDesc + '</td>';
                    xmlStr += '<td>'+ quantity +'</td>';
                    xmlStr += '<td>'+ rate +'</td>';
                    xmlStr += '<td>'+ amount +'</td>';
                    xmlStr += '</tr>';

                }
                xmlStr += '</tbody>';
                xmlStr +='</table>';
                //#endregion

                xmlStr += '</body></pdf>';
                log.audit('XML', xmlStr)

                var pdfFile = render.xmlToPdf({
                    xmlString: xmlStr
                });

                log.debug({
                    title: "pdfFile",
                    details: pdfFile
                })

                pdfFile.name = vendorReturnAuth + ".pdf";

                pdfFile.folder = 32015;

                var fileId = pdfFile.save();
                log.debug("Saved PDF to file " + fileId);
                var pdfObj = file.load({
                    id: fileId
                });

                log.debug('File URL', pdfObj.url)

                record.submitFields({
                    type: 'vendorreturnauthorization',
                    id: vrmaRec.id,
                    values: {
                        'custbody12': pdfObj.url
                    }
                    
                })
                log.debug('Email List', emailList.length)
                if(emailList.length > 0) {
                    email.send({
                        author: currentUser.id,
                        body: ' ',
                        recipients: emailList,
                        subject: vrmaRec.id + ' ' + vendor,
                        attachments: [pdfObj],
                        relatedRecords: {
                            transactionId: vrmaRec.id
                        }
                    })
                }

            } catch(error) {
                log.debug("Error", error);
            }

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
