(function() {

  return {

    requests: {

      /*TICKETS SIDE_BAR*/

      reviewedTicket: function(id){

        return {
          
          url: '/api/v2/search.json?query=' + id + ' tags:tl_reviewed',
          type: 'GET',
          dataType: 'json'

        };

      },

      getTags: function(id){

        return {

          url: '/api/v2/tickets/' + id + '/tags.json',
          type: 'GET',
          dataType: 'json'
        
        };

      },

      removeTags: function(arr_tag, id){

        console.log('/api/v2/tickets/' + id + '/tags.json and addtag is ' + arr_tag);

        return {

          url: '/api/v2/tickets/' + id + '/tags.json',
          type: 'DELETE',
          dataType: 'json',
          contentType: 'application/json; charset=UTF-8',
          data: arr_tag
        
        };

      },

      updateTicketResults: function(arr_tag, id){

        console.log('/api/v2/tickets/' + id + '/tags.json and addtag is ' + arr_tag);

        return {

          url: '/api/v2/tickets/' + id + '/tags.json',
          type: 'PUT',
          dataType: 'json',
          contentType: 'application/json; charset=UTF-8',
          data: arr_tag

        };

      },

      /*NAV_BAR*/

      getGroups: function(){
        return {
          url: '/api/v2/groups.json',
          type: 'GET',
          dataType: 'json'
        };
      },

      getAgents: function(data){
        return{
          url: '/api/v2/search.json?query=type:user group:"' + data + '"',
          type: 'GET',
          dataType: 'json'
        };
      },

      getTicketsByChannel: function(data, via, created_on){

        console.log('/api/v2/search.json?query=type:ticket assignee:"' + data + '" ' + created_on + ' via:"' + via + '" -tags:tl_reviewed');
        return{
          url:'/api/v2/search.json?query=type:ticket assignee:"' + data + '"' + created_on + ' via:"' + via + '" -tags:tl_reviewed',
          type: 'GET',
          dataType: 'json'
        };
      },

      getPendingReviews: function(data){

        //console.log('/api/v2/search.json?query=type:ticket assignee:' + data  + ' tags:agent_review');
        return{
          url:'/api/v2/search.json?query=type:ticket assignee:' + data  + ' tags:agent_review',
          type: 'GET',
          dataType: 'json'
        };
      },

      getReviewedByAgent: function(data){

        //console.log('/api/v2/search.json?query=type:ticket assignee:' + data  + ' tags:agent_review');
        return{
          url:'/api/v2/search.json?query=type:ticket assignee:' + data  + ' tags:ag_reviewed',
          type: 'GET',
          dataType: 'json'
        };
      },      

      getTicketsBySatisfaction: function(data, rating){
        return{
          url:'/api/v2/search.json?query=type:ticket assignee:"' + data + '" created>2015-01-01 created<2015-12-31 satisfaction:"' + rating + '"',
          type: 'GET',
          dataType: 'json'
        };
      }
    },



    events: {
      'app.activated': 'loadData',

      //DOM TICKET SIDEBAR
      'click #save_form':'saveReview',
      'change input:radio':'hideReviewed',
      'click #uncheck_all':'uncheckAll',
      'click #myTab a':'changeTabs',





      //DOM NAV_BAR
      'change #groups':'loadAgents',
      'change #agents':'agent_info',
      'focus #datepicker_from':'showCalendar',
      'focus #datepicker_to':'showCalendar',
      'change #datepicker_to':'showByDate',
      'click #button_via': 'showChannels',
      'change #filter_date':'showDates',
      'change #ticket_via':'applyFilterVia'
    },

    changeTabs: function(e) {

        
      e.preventDefault();

      //Deactivate all the elements
      this.$('.bs-example li').removeClass('active');
      this.$('.bs-example div').removeClass('active');
      //Activate all the elements
      this.$('#' + e.currentTarget.name).addClass('active');
      this.$('#' + e.currentTarget.name + '_questions').addClass('active');



    },


    loadData: function() {

      if(this.currentLocation() == 'ticket_sidebar'){

        var currentUser = this.currentUser();

        if(currentUser.role() == "admin"){

      		this.ajax('reviewedTicket', this.ticket().id()).done(function(data){

            if(data.results.length == 1){

              this.ajax('getTags', this.ticket().id()).done(function(data){

                for(var i = 1; i <= 21; i++){
                  
                  for(var j = 0; j <= data.tags.length; j++){
                    
                    if(this.$("#tl_question_" + i).attr("value") == data.tags[j]){

                      this.$("#tl_question_" + i).prop('checked', true);
                      
                    }
                  
                  }  

                }

              });

            }

          });

          this.switchTo('tl_questions');
        
        }else{

          this.switchTo('ag_questions');
        
        }


    	 } else if (this.currentLocation() == 'nav_bar'){

    		var groups = this.ajax('getGroups');    
        var drop_groups = "<select id='groups'><option value='0'>-- Select group --</option>";

        this.when(groups).then(function(data){

          var groups = data.groups;
          
          _.each(groups, function(data,k){
            drop_groups += "<option value='" + data.name + "'>" + data.name + "</option>";
          });
          var data = JSON.parse(this.setting('default_channels'));
          this.switchTo('result',{settings: data.settings});
          this.$("#d_groups").html(drop_groups + "</select>");

        });

    	} else {

        var v_subdomain = this.currentAccount().subdomain();
        var currentUser = this.currentUser();
        var pending_review = this.ajax('getPendingReviews', currentUser.id());

        this.switchTo('agent_review');
        this.popover('show');
        this.popover('hide');

        this.when(pending_review).then(function(data){

          var p_review = data.results;

                 
          _.each(p_review, function(data){

            this.$("#agent_pending_reviews").append("<tr class='colored'><td><a href='https://" + v_subdomain + ".zendesk.com/agent/tickets/" + data.id + "'>" + data.id + "</a></td><td>" + data.subject + "</td><td>" + data.status + "</td></tr>");

          });

        });

      }

    },

      /*********************/
      /*******NAV_BAR*******/
      /*********************/

      loadAgents: function(event_name) {

        var agents_name = new Array();
        var table_agents;

        this.ajax('getAgents',event_name.currentTarget.value).done(function(data){
         
        if(data.results.length > 0){

          var agents = data.results;
          table_agents = "<select id='agents'><option value='0'>-- Select an agent --</option>";
        
          _.each(agents, function(data,k){
              table_agents += "<option value='" + data.name + "'>" + data.name + "</option>";
          });

        }else{
          table_agents = "-- Empty group. --";
        }
          

          this.$("#d_agents").html(table_agents);
          

        });  
      },

      showCalendar: function(event_name){
          
          dt_name = event_name.currentTarget.id;

          this.$("#" + dt_name).datepicker();
      },

      
      agent_info: function(event_name){

        var v_subdomain = this.currentAccount().subdomain();
        var b = JSON.parse(this.setting('default_channels'));
        var total_channels = b.settings.channels.length;
        var channels_data = b.settings.channels;
     
        this.$("#tickets").empty(); //before show the results clean the table

        for(var i = 0; i < total_channels; i++){

          var current_channel = channels_data[i];
          var tickets_by_channel = this.ajax('getTicketsByChannel',event_name.currentTarget.value, current_channel,"created>" + moment().subtract(90, 'days').format("YYYY-MM-DD") + " created<" + moment().format("YYYY-MM-DD"));

          this.when(tickets_by_channel).then(function(data_mail){

            var via_mail = data_mail.results;
                        
            if(data_mail.count > 0){

              //If exists, check the checkbox (Channel/Via)
              this.$('#channel_' + via_mail[0].via.channel)[0].checked = true;
              //If exists, create the table with the channel as ID
              this.$("#tickets").append("<div id='results_by_channel_" + via_mail[0].via.channel + "'><table width='100%' id='tickets_by_channel_" + via_mail[0].via.channel + "'></table></div>");

              this.$("#tickets_by_channel_" + via_mail[0].via.channel).append("<tr><th colspan='4' class='table_result_headers'>" + via_mail[0].via.channel + "</th></tr><tr class='table_result_title'><td width='10%'>Ticket Id</td><td width='20%'>Created at</td><td width='60%'>Subject</td><td width='10%'>Status</td></tr>");

              _.each(via_mail.slice(0,this.setting('tickets_by_channel')), function(data_mail){

                    this.$("#tickets_by_channel_" + data_mail.via.channel).append("<tr class='colored'><td><a href='https://" + v_subdomain + ".zendesk.com/agent/tickets/" + data_mail.id + "'>" + data_mail.id + "</a></td><td>" + moment(data_mail.created_at).format('DD-MM-YYYY') + "</td><td>" + data_mail.subject + "</td><td>" + data_mail.status + "</td></tr>");
              
              });

            }
    
          });   

        }

        //get pending review tickets by agent
        
        var pending_review = this.ajax('getPendingReviews', event_name.currentTarget.value);

        this.when(pending_review).then(function(data){

          var p_review = data.results;

          this.$("#pe_re_by_agent").html('<td class="alert_msg">No pending tickets</td>');

          if(data.count > 0){

            this.$(".alert_msg").hide();
            this.$("#pe_re_by_agent").append('<div class="pe_ti_result"></div>');
                 
            _.each(p_review, function(data){

              this.$(".pe_ti_result").append('<a href="https://' + v_subdomain + '.zendesk.com/agent/tickets/' + data.id + '">' + data.id + '</a>&nbsp;');

            });

          }

        });


        //get reviewed tickets by agent
        
        var pending_review = this.ajax('getReviewedByAgent', event_name.currentTarget.value);

        this.when(pending_review).then(function(data){

          var p_review = data.results;

          this.$("#re_by_agent").html('<td class="alert_msg_reviewed">No reviewed tickets</td>');

          if(data.count > 0){

            this.$(".alert_msg_reviewed").hide();
            this.$("#re_by_agent").append('<div class="re_ti_result"></div>');
                 
            _.each(p_review, function(data){

              this.$(".re_ti_result").append('<a href="https://' + v_subdomain + '.zendesk.com/agent/tickets/' + data.id + '">' + data.id + '</a>&nbsp;');

            });

          }

        });
   
      },

      showByDate:function(event_name){

        console.log("Desde: " + moment(this.$("#datepicker_from").val()).format('DD-MM-YYYY') + " hasta " + moment(event_name.currentTarget.value).format('DD-MM-YYYY'));

      }, 

      showChannels:function(){

        this.$("#ticket_via").toggle();

      },

      applyFilterVia:function(event_name){

        if(event_name.target.checked){
          this.$("#results_by_" + event_name.target.id).toggle();
        }else{
          this.$("#results_by_" + event_name.target.id).css("display","none");
        }
        //console.log(event_name.target.id);
        

      },

      showDates:function(e){

        if(e.currentTarget.value == "custom"){

          this.$("#ticket_date").toggle();

        }
      },


      /*********************/
      /*******TICKET_SIDEBAR*******/
      /*********************/

      saveReview:function(){

        var arr_tag = this.ticket().tags();
        var new_tags = [];
        var flag = 0;
        var v_tags = '{"tags":[';
        var currentUser = this.currentUser();

        if(currentUser.role() == "admin"){

            //*********************************
            //CHECK IF THERE IS ANY QUALITY TAG
            //*********************************

            for(var i = 0; i < arr_tag.length; i++){

              if(arr_tag[i].includes('tl_')){

                v_tags += '"' + arr_tag[i] + '",';
                flag = 1;

              }

            }

            if(this.$("#toAgent").prop('checked', true)){

              v_tags += '"tl_reviewed","agent_review"]}';

            }else{

              v_tags += '"tl_reviewed"]}';

            }


            //IF WE FIND A QUALITY TAG REMOVE IT

            if(flag == 1){

              this.ajax('removeTags', v_tags, this.ticket().id()).done(function(data){

                flag = 0;

              });

            }

            //***********************************
            //END REMOVE QUALITY TAGS
            //***********************************  


            //***********************************
            //ADD QUALITY TAGS SELECTED (IN CASE)
            //***********************************

            v_tags = '{"tags":[';

            for(var i = 1; i <= 21; i++){
              
              if(this.$("#tl_question_" + i).is(":checked")){

                v_tags += '"' + this.$("#tl_question_" + i).attr("value") + '",';
                flag = 1;

              }

            }

            if(this.$("#toAgent").prop('checked', true)){

              v_tags += '"tl_reviewed","agent_review"]}';

            }else{

              v_tags += '"tl_reviewed"]}';

            }

            if(flag == 1){

              this.ajax('updateTicketResults',v_tags, this.ticket().id());

            }

            //***********************************
            //END ADD QUALITY TAGS
            //*********************************** 

        }else{

            var v_tags;

            //FIRST WE REMOVE THE TAG agent_review
            v_tags = '{"tags":["agent_review"]}';

            this.ajax('removeTags', v_tags, this.ticket().id());

            //ONCE REMOVED WE ADD THE REST OF TAGS

            v_tags = '{"tags":[';

            for(var i = 1; i <= 21; i++){
              
              if(this.$("#ag_question_" + i).is(":checked")){

                v_tags += '"' + this.$("#ag_question_" + i).attr("value") + '",';

              }

            }

            v_tags += '"ag_reviewed"]}';

            this.ajax('updateTicketResults',v_tags, this.ticket().id());
            this.$('#submit_ag_section').hide();

        }

      },

      hideReviewed:function(){

        if(this.$("#reviewed").is(":checked")){

          this.$("#reviewed").prop( "checked", false );

        }
        
        this.$("#reviewed").attr("disabled", true);

      },

      uncheckAll:function(){

        this.$("#reviewed").attr("disabled", false);

        for(var i = 1; i <= 21; i++){

          if(this.$("#tl_question_" + i).is(":checked")){

              this.$("#tl_question_" + i).prop( "checked", false );

          }
          
        }

      }
  };

}());
