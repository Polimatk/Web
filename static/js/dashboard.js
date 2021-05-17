let poll = null;
let theme = window.matchMedia('(prefers-color-scheme: dark)') ? 'dark' : 'light';
if(typeof app !== 'undefined' && ['dark', 'light'].includes(app.theme)) theme = app.theme;
toastr.options = {
    showMethod: 'slideDown',
    hideMethod: 'slideUp'
}
const fakeOptions = [
    'Apple',
    'Microsoft',
    'Chromebook',
    'HP',
    'Dell'
];
const prettyOptions = function() {
    console.log('Why the fuck does JavaScript suck so god damn much?');
    $('#poll-options').children().each(function() {
        if($(this).css('display') != 'none') {
            $(this).removeAttr('id');
        }
    });
}
const fixPollOptions = function() {
    const opts = $('#poll-options').children();
    for(let i = 1; i < opts.length; i++) {
        let option = $(opts[i]);
        option.find('label').text('Option #' + i);
        option.find('input').attr('id', 'poll-option-' + i).attr('placeholder', fakeOptions[i - 1] || 'So many options');
    }
    setTimeout(prettyOptions, 1000);
}
$(document).ready(function() {
    if(app.page && app.page.guild) {
        const vote = function(choice) {
            toastr.info('Submitting your vote...', 'Voting');
            $.ajax({
                url: 'https://api.polima.tk/v1/polls/' + poll.id,
                type: 'PATCH',
                data: {
                    choice: choice
                },
                headers: {
                   Authorization: 'Bearer ' + app.token
                }
            }).done(function() {
                toastr.clear();
                toastr.info('Your vote has been counted!', 'Voting');
            }).fail(function(e) {
                toastr.clear();
                toastr.error(e.responseJSON.error, 'Voting');
            });
        }
        $.get('https://api.polima.tk/v1/polls?type=poll&guild=' + app.page.guild).done(function(data) {
            poll = data;
            window.onmessage = function(e, f) {
                if(typeof e.data === 'object' && e.data.vote) {
                    vote(e.data.vote);
                }
            }
            $(document).keypress(function(e) {
                if(e.keyCode >= 49 && e.keyCode < (49 + poll.choices.length)) {
                    vote(e.keyCode - 48);
                }
            });
        });
    }


    feather.replace();
    $('[data-mdb-toggle="tooltip"]').tooltip();
    $('[data-mdb-toggle="snackbar"]').toast();

    $('#discord').click(function() {
        $('#signin').modal('show');
    });
    $('#navbtn, .sidebar-bg').click(function() {
        $('.sidebar').toggleClass('show');
        $('.sidebar-bg').toggleClass('show');
    });
    $('#commands').on('click', '.command-edit', function(e) {
        const command = $(this).parent().parent();
        const name = command.find('.command-name').text();
        $('#command-name').val(name);
        $('#command-name').data('original', name);
        $('#command-response').val(command.find('.command-response').text());
        $('#command-permissions').val(command.find('.command-permissions').text().toLowerCase());
        $('#command-delete').removeAttr('disabled');
        $('#command-title').text('Editing ' + name);
        $('#command-editor').modal('show');
    });
    $('#command-add').click(function() {
        const cmd = $('#command-clone').clone().prependTo('#commands tbody').show();
        setTimeout(function() {
            cmd.removeAttr('id');
        }, 1000);
        $('#command-name').data('original', null);
        $('#command-name, #command-response').val('');
        $('#command-permissions').val('all');
        $('#command-delete').attr('disabled', '');
        $('#command-title').text('New command');
        $('#command-editor').modal('show');
    });
    $('#command-save').click(function() {
        if(!$('#command-name').val().length || !$('#command-response').val().length) {
            return;
        }
        $('#command-save').attr('disabled', '');
        const adding = $('#command-delete').is('[disabled]');
        const save = function() {
            $.ajax({
                url: 'https://api.polima.tk/v1/commands/' + $('#command-name').val(),
                type: 'PUT',
                data: {
                    guild: app.guild,
                    response: $('#command-response').val(),
                    permissions: $('#command-permissions').val().toLowerCase()
                },
                headers: {
                    Authorization: 'Bearer ' + app.token
                }
            }).done(function() {
                $('#command-save, #command-delete').removeAttr('disabled');
                toastr.info(adding ? 'Command added' : 'Command updated',
                    ($('#command-name').data('original') && $('#command-name').data('original') != $('#command-name').val() ?
                    $('#command-name').data('original') + ' to ' : '')
                    + $('#command-name').val());
                let cmd = adding ? $('#commands tbody tr:first') : $('[data-command="' + $('#command-name').data('original') + '"]');
                cmd.attr('data-command', $('#command-name').val());
                cmd.find('.command-name').text($('#command-name').val());
                cmd.find('.command-response').text($('#command-response').val());
                cmd.find('.command-permissions').text($('#command-permissions').val().substr(0, 1).toUpperCase() + $('#command-permissions').val().substr(1));
                $('#command-editor').modal('hide');
            });
        }
        if(adding || !adding && $('#command-name').data('original') == $('#command-name').val()) {
            save();
        }
        else {
            $.ajax({
                url: 'https://api.polima.tk/v1/commands/' + $('#command-name').data('original') + '?guild=' + app.guild,
                type: 'DELETE',
                headers: {
                    Authorization: 'Bearer ' + app.token
                }
            }).done(save);
        }
    });
    $('#command-delete').click(function() {
        $('#command-delete').attr('disabled', '');
        $.ajax({
            url: 'https://api.polima.tk/v1/commands/' + $('#command-name').data('original') + '?guild=' + app.guild,
            type: 'DELETE',
            headers: {
                Authorization: 'Bearer ' + app.token
            }
        }).done(function() {
            toastr.info('Command deleted', $('#command-name').data('original'))
            $('[data-command="' + $('#command-name').data('original') + '"]').remove();
            $('#command-delete').removeAttr('disabled');
            $('#command-editor').modal('hide');
        });
    });
    $('#command-editor').on('hidden.bs.modal', function() {
        var adding = $('#command-delete').is('[disabled]');
        if(adding) {
            $('#commands tbody tr:first').remove();
        }
    });
    $('#poll-add').click(function() {
        let option = $('#poll-clone').clone().appendTo($('#poll-options')).show();
        fixPollOptions();
    });
    $('#poll-options').on('click', '.btn-danger', function() {
        $(this).parent().remove();
        fixPollOptions();
    });
    $('#poll-start').click(function() {
        $('#poll-start').attr('disabled', '');
        let options = [];
        let optionInputs = $('#poll-options input');
        for(let i = 1; i < optionInputs.length; i++) {
            options.push({name: $(optionInputs[i]).val()});
        }
        $.ajax({
            url: 'https://api.polima.tk/v1/polls',
            type: 'POST',
            headers: {
                Authorization: 'Bearer ' + app.token
            },
            data: {
                guild: app.guild,
                title: $('#poll-title').val(),
                duration: $('#poll-length').val(),
                choices: options
            }
        }).done(function() {
            $('#poll-start').removeAttr('disabled');
        });
    });
    $('#poll-end').click(function() {
        $('#poll-end').attr('disabled', '');

    });
    if($('#poll-load').length) {
        $.get({
            url: 'https://api.polima.tk/v1/polls?type=poll&guild=' + app.guild,
            headers: {
                Authorization: 'Bearer ' + app.token
            }
        }).done(function(poll) {
            $('#poll-load').remove();
            $('#poll-title').text(poll.title);
            $('#poll-current').show();
        }).fail(function() {
            $('#poll-load').remove();
            $('#poll-new').show();
        });
    }
    $('body').on('click', '#ama-respond', function() {
        $(this).attr('disabled', '');
    });
    $('#ama-start').click(function() {
        $('#ama-start').attr('disabled', '');

    });
    $('#ama-end').click(function() {
        $('#ama-end').attr('disabled', '');

    });
    if($('#ama-load').length) {
        $.get({
            url: 'https://api.polima.tk/v1/polls?access_token=readonly&type=ama&guild=' + app.page.guild,
            headers: {
                Authorization: 'Bearer ' + app.token
            }
        }).done(function(poll) {
            $('#ama-load').hide();
            let ama;
            if($('#ama-clone').length) {
                ama = $('#ama-clone').clone().appendTo('#ama-container');
                let choices;
                switch(poll.choices.length) {
                    case 0:
                        choices = 'Add your choice';
                        break;
                    case 1:
                        choices = 'View 1 choice';
                        break;
                    default:
                        choices = 'View ' + poll.choices.length + ' choices';
                }
                ama.find('#ama-choices').text(choices);
            } else if($('#ama-current').length) {
                ama = $('#ama-current').show();
            }
            ama.find('#ama-title').text(poll.title);
            ama.slideDown();
        }).fail(function() {
            $('#ama-load').hide();
            $('#ama-none').slideDown();
        });
    }
});
