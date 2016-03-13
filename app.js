(function() {

  return {

    requests: {

      /*TICKETS SIDE_BAR*/

      reviewedTicket: function(id){

        return {
          
          url: '/api/v2/search.json?query=' + id + ' tags:reviewed',
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

        console.log(arr_tag);

        return {

          url: '/api/v2/tickets/' + id + '/tags.json',
          type: 'DELETE',
          dataType: 'json',
          contentType: 'application/json; charset=UTF-8',
          data: arr_tag
        
        };

      },

      updateTicketResults: function(arr_tag, id){

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

      getTicketsByChannel: function(data, via){
        return{
          url:'/api/v2/search.json?query=type:ticket assignee:"' + data + '" created>2015-01-01 created<2015-12-31 via:"' + via + '"',
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
      'click #save_form':'getValues',
      'change input:radio':'hideReviewed',
      'click #uncheck_all':'uncheckAll',

      //DOM NAV_BAR
      'change #groups':'loadAgents',
      'change #agents':'agent_info',
      'focus #datepicker_from':'showCalendar',
      'focus #datepicker_to':'showCalendar',
      'click #button_via': 'showChannels',
      'change #filter_date':'showDates'
    },

    loadData: function() {

    	if(this.currentLocation() == 'ticket_sidebar'){

      		this.ajax('reviewedTicket', this.ticket().id()).done(function(data){

          if(data.results.length == 1){

            this.ajax('getTags', this.ticket().id()).done(function(data){

              for(var i = 1; i <= 18; i++){
                
                for(var j = 0; j <= data.tags.length; j++){
                  
                  if(this.$("#coach_question_" + i).attr("value") == data.tags[j]){

                    this.$("#coach_question_" + i).prop('checked', true);

                  }
                
                }  

              }

            });

          }

        });
        
        this.switchTo('questions');

    	 } else if (this.currentLocation() == 'nav_bar'){

    		var groups = this.ajax('getGroups');    
        var drop_groups = "<select id='groups'><option value='0'>-- Select group --</option>";

        this.when(groups).then(function(data){

          var groups = data.groups;
          
          _.each(groups, function(data,k){
            drop_groups += "<option value='" + data.name + "'>" + data.name + "</option>";
          });

          this.switchTo('result');
          this.$("#d_groups").html(drop_groups + "</select>");

        });

    	}else{

        console.log("Top Bar");

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

        //!!FIX AND OPTIMIZE THE SEARCH PART

        var tickets_via_mail = this.ajax('getTicketsByChannel',event_name.currentTarget.value, "mail");
        var tickets_via_chat = this.ajax('getTicketsByChannel',event_name.currentTarget.value, "chat");
        var tickets_sat_good = this.ajax('getTicketsBySatisfaction',event_name.currentTarget.value, "good");
        var tickets_sat_bad = this.ajax('getTicketsBySatisfaction',event_name.currentTarget.value, "bad");
        var v_subdomain = this.currentAccount().subdomain();


        //this.when(tickets_via_mail).then(function(data_mail){
        this.when(tickets_via_mail).then(function(data_mail){
          this.when(tickets_via_chat).then(function(data_chat){
            this.when(tickets_sat_good).then(function(data_good){
              this.when(tickets_sat_bad).then(function(data_bad){

                var table_tickets;//Var containing the result of the search and will display the table
                var via_mail = data_mail.results;//Total of tickets via email
                var via_chat = data_chat.results;//Total of tickets via chat
                var sat_good = data_good.results;//Total of tickets good rating
                var sat_bad = data_bad.results;//Total of tickets bad rating

                var total_result = 3;//Total of results to show
                var cont = 0;

                table_tickets = "<div><table>";

                if(via_mail.length > 0 || via_chat.length > 0 || sat_good.length > 0 || sat_bad.length > 0){

                  if(via_mail.length > 0){

                    table_tickets +="<tr><th colspan='4' class='table_result_headers'>Email</th></tr><tr class='table_result_title'><td>Ticket Id</td><td>Created at</td><td>Subject</td><td>Status</td></tr>";

                    _.each(via_mail, function(data_mail,k){
                        if(cont < total_result){
                          table_tickets += "<tr class='colored'><td><a href='https://" + v_subdomain + ".zendesk.com/agent/tickets/" + data_mail.id + "'>" + data_mail.id + "</a></td><td>" + moment(data_mail.created_at).format('DD-MM-YYYY') + "</td><td>" + data_mail.subject + "</td><td>" + data_mail.status + "</td></tr>";
                          cont++;
                        }
                    });
                  }

                  if(via_chat.length > 0){
                    cont = 0;
                    table_tickets +="<tr><th colspan='4' class='table_result_headers'>Chat</th></tr><tr class='table_result_title'><td>Ticket Id</td><td>Created at</td><td>Subject</td><td>Status</td></tr>";

                    _.each(via_chat, function(data_chat,k){
                        if(cont < total_result){
                          table_tickets += "<tr class='colored'><td><a href='https://" + v_subdomain + ".zendesk.com/agent/tickets/" + data_chat.id + "'>" + data_chat.id + "</a></td><td>" + moment(data_chat.created_at).format('DD-MM-YYYY') + "</td><td>" + data_chat.subject + "</td><td>" + data_chat.status + "</td></tr>";
                        }            
                    });
                  }

                  if(sat_good.length > 0){
                    cont = 0;
                    table_tickets +="<tr><th colspan='4' class='table_result_headers'>Good Satisfaction</th></tr><tr class='table_result_title'><td>Ticket Id</td><td>Created at</td><td>Subject</td><td>Status</td></tr>";

                    _.each(sat_good, function(data_good,k){
                        if(cont < total_result){
                          if(data_good.satisfaction_rating.comment != ""){

                            var v_comment = "<span style='color:red'>c</span>";

                          }
                          table_tickets += "<tr class='colored'><td><a href='https://" + v_subdomain + ".zendesk.com/agent/tickets/" + data_good.id + "'>" + data_good.id + " " + v_comment + "</a></td><td>" + moment(data_good.created_at).format('DD-MM-YYYY') + "</td><td>" + data_good.subject + "</td><td>" + data_good.status + "</td></tr>";
                        }            
                    });
                  }

                  if(sat_bad.length > 0){
                    cont = 0;
                    table_tickets +="<tr><th colspan='4' class='table_result_headers'>Bad Satisfaction</th></tr><tr class='table_result_title'><td>Ticket Id</td><td>Created at</td><td>Subject</td><td>Status</td></tr>";

                    _.each(sat_bad, function(data_bad,k){
                        if(cont < total_result){
                          table_tickets += "<tr class='colored'><td><a href='https://" + v_subdomain + ".zendesk.com/agent/tickets/" + data_bad.id + "'>" + data_bad.id + "</a></td><td>" + moment(data_bad.created_at).format('DD-MM-YYYY') + "</td><td>" + data_bad.subject + "</td><td>" + data_bad.status + "</td></tr>";
                        }            
                    });
                  }

                }else{

                  table_tickets ="<tr><td colspan='3'>No results</td></tr>"; 

                }

                table_tickets += "</table></div>";

                this.$(".no_user").hide();
                this.$(".submit_section_nb").toggle();
                this.$("#tickets").html(table_tickets);
                

              });
            });
          });
        });
      },

      showChannels:function(){

          this.$("#ticket_via").toggle();

      },

      showDates:function(e){

        if(e.currentTarget.value == "custom"){

          this.$("#ticket_date").toggle();

        }
      },


      /*********************/
      /*******TICKET_SIDEBAR*******/
      /*********************/

      getValues:function(){

        var arr_tag = this.ticket().tags();
        var new_tags = [];
        var flag = 0;
        var v_tags = '{"tags":[';


        //*********************************
        //CHECK IF THERE IS ANY QUALITY TAG
        //*********************************

        for(var i = 0; i < arr_tag.length; i++){

          if(arr_tag[i].includes('qua_')){

            v_tags += '"' + arr_tag[i] + '",';
            flag = 1;

          }

        }

        v_tags += '"reviewed"]}';

        //IF WE FIND A QUALITY TAG REMOVE IT

        if(flag == 1){

          this.ajax('removeTags', v_tags, this.ticket().id()).done(function(data){

            console.log(data);
            flag = 0;

          });

        }

        //***********************************
        //END REMOVE QUALITY TAGS
        //***********************************  


        //***********************************
        //ADD QUALITY TAGS SELECTED (IN CASE)
        //***********************************

        var v_tags = '{"tags":[';

        for(var i = 1; i <= 18; i++){
          
          if(this.$("#coach_question_" + i).is(":checked")){

            v_tags += '"' + this.$("#coach_question_" + i).attr("value") + '",';
            flag = 1;

          }

        }

        v_tags += '"reviewed"]}';

        if(flag == 1){

          this.ajax('updateTicketResults',v_tags, this.ticket().id()).done(function(data){
            
            console.log("Saved!!");

          });

        }

        //***********************************
        //END ADD QUALITY TAGS
        //*********************************** 

      },

      hideReviewed:function(){

        if(this.$("#reviewed").is(":checked")){

          this.$("#reviewed").prop( "checked", false );

        }
        
        this.$("#reviewed").attr("disabled", true);

      },

      uncheckAll:function(){

        this.$("#reviewed").attr("disabled", false);

        for(var i = 1; i <= 18; i++){

          if(this.$("#coach_question_" + i).is(":checked")){

              this.$("#coach_question_" + i).prop( "checked", false );

          }
          
        }

      }
  };

}());
