window.addEventListener('DOMContentLoaded', () => {
    let pageNumber = 0;
    let totalPages = 0;
    loadAdminPanel();

    //Fetch and fill enum select options
    const $selectRace = $('#create-race');
    const $selectProfession = $('#create-profession');
    if ($selectRace.length && typeof races !== 'undefined') {
        $.each(races, (_index, value) => {
            $selectRace.append($('<option></option>').val(value).text(value));
        });
    }
    if ($selectProfession.length && typeof professions !== 'undefined') {
        $.each(professions, (_index, value) => {
            $selectProfession.append($('<option></option>').val(value).text(value));
        });
    }

    //Reset the page on 'count per page' changes
    $('#page-size').on('change', function () {
        pageNumber = 0;
        loadAdminPanel();
    });

    //Reloads the whole admin panel
    function loadAdminPanel() {
        const pageSize = parseInt($('#page-size').val());
        $.ajax({
            url: '/rest/players/count',
            method: 'GET',
            success: playerCount => {
                totalPages = Math.ceil(playerCount / pageSize);
                buildPagination(totalPages);
                fetchPlayerTable(pageNumber, pageSize);
            }
        });
    }

    //Fills the player table
    function fetchPlayerTable(page, size) {
        $.ajax({
            url: '/rest/players',
            method: 'GET',
            data: {
                pageNumber: page,
                pageSize: size
            },
            success: data => {
                $('#table-body').empty();
                $.each(data, (_index, item) => {
                    const birthday = new Date(item.birthday).toLocaleDateString(
                        'ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }
                    );
                    const banned = item.banned ? 'Yes' : 'No';
                    const row = `<tr>
                            <td>${item.id}</td>
                            <td class="editable-name">${item.name}</td>
                            <td class="editable-title">${item.title}</td>
                            <td class="editable-race">${item.race}</td>
                            <td class="editable-profession">${item.profession}</td>
                            <td>${item.level}</td>
                            <td>${birthday}</td>
                            <td class="editable-banned">${banned}</td>
                            <td class="action-cell">
                                <img src="/static/img/edit.png" alt="Edit" class="icon-btn edit-btn" data-id="${item.id}">
                            </td>
                            <td class="action-cell">
                                <img src="/static/img/delete.png" alt="Delete" class="icon-btn delete-btn" data-id="${item.id}">
                            </td>
                        </tr>`;
                    $('#table-body').append(row);
                });
            }
        });
    }

    //Builds the list of pages
    function buildPagination(totalPages) {
         $('#pages-list').empty();

        for (let i = 0; i < totalPages; i++) {
            const $pageLink = $('<button>').text(i + 1).addClass('page-btn');
            if (i === pageNumber) $pageLink.addClass('active');

            //Update the current page on a page change
            $pageLink.on('click', function () {
                if ($(this).hasClass('active')) return;

                $('#pages-list').find('.page-btn.active').removeClass('active');
                $(this).addClass('active');
                pageNumber = i; //works because of closure

                const pageSize = parseInt($('#page-size').val());
                fetchPlayerTable(pageNumber, pageSize);
            });
            $('#pages-list').append($pageLink);
        }
    }

    //Remove a player by clicking the delete button
    $('#table-body').on('click', '.delete-btn', function () {
        //jQuery-specific method to fetch the 'data-id' attribute
        const playerId = $(this).data('id');

        if (confirm('Are you sure you want to delete this player?')) {
            $.ajax({
                url: `/rest/players/${playerId}`,
                method: 'DELETE',
                success: () => loadAdminPanel()
            });
        }
    });

    //Make fields editable by clicking the edit button
    $('#table-body').on('click', '.edit-btn', function () {
        const $currentRow = $(this).closest('tr');
        $currentRow.find('.delete-btn').hide();
        $(this).attr('src', '/static/img/save.png').attr('alt', 'Save')
            .removeClass('edit-btn').addClass('save-btn');

        //Text inputs
        const makeEditableText = (selector) => {
            const $cell = $currentRow.find(selector);
            const currentText = $cell.text();
            $cell.html(`<input type="text" value="${currentText}" style="width: 90%;">`);
        };
        makeEditableText('.editable-name');
        makeEditableText('.editable-title');

        //Enum selections
        const makeEditableSelect = (selector, options) => {
            const $cell = $currentRow.find(selector);
            const currentValue = $cell.text();
            const $select = $('<select style="width: 90%;"></select>');

            $.each(options, (_index, optionValue) => {
                const $option = $('<option></option>').val(optionValue).text(optionValue);

                if (optionValue === currentValue) {
                   $option.prop('selected', true);
                }
                $select.append($option);
            });
            $cell.html($select);
        };
        makeEditableSelect('.editable-race', races); //see index.html
        makeEditableSelect('.editable-profession', professions);

        const $bannedCell = $currentRow.find('.editable-banned');
        const bannedValue = $bannedCell.text();
        $bannedCell.html(`
            <select>
                <option value="false" ${bannedValue === 'No' ? 'selected' : ''}>No</option>
                <option value="true" ${bannedValue === 'Yes' ? 'selected' : ''}>Yes</option>
            </select>
        `);
    });

    //Save all edits to the player info
    $('#table-body').on('click', '.save-btn', function () {
        const $currentRow = $(this).closest('tr');
        const playerId = $(this).data('id');

        const playerData = {
            name: $currentRow.find('.editable-name input').val(),
            title: $currentRow.find('.editable-title input').val(),
            race: $currentRow.find('.editable-race select').val(),
            profession: $currentRow.find('.editable-profession select').val(),
            banned: $currentRow.find('.editable-banned select').val() === 'true'
        };
        $.ajax({
            url: `/rest/players/${playerId}`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(playerData),
            success: () => loadAdminPanel()
        });
    });

    //Save a newly created player
    $('#create-save-btn').on('click', function () {
        const level = parseInt($('#create-level').val());
        const rawBirthday = $('#create-birthday').val();
        const birthday = rawBirthday ? new Date(rawBirthday).getTime() : null;

        const playerData = {
            name: $('#create-name').val(),
            title: $('#create-title').val(),
            race: $('#create-race').val(),
            profession: $('#create-profession').val(),
            level: level,
            birthday: birthday,
            banned: $('#create-banned').val() === 'true'
        };

        //Validations
        if (!playerData.name || !playerData.name.trim()) {
            alert('Please enter a player name.');
            return;
        }
        if (isNaN(playerData.level) || playerData.level < 1 || playerData.level > 100) {
            alert('Level must be a number between 1 and 100.');
            return;
        }
        if (!playerData.birthday) {
            alert('Please select a birthday.');
            return;
        }

        $.ajax({
            url: '/rest/players',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(playerData),
            success: () => {
                $('#create-name').val('');
                $('#create-title').val('');
                $('#create-level').val('');
                $('#create-birthday').val('');
                $('#create-race').prop('selectedIndex', 0);
                $('#create-profession').prop('selectedIndex', 0);
                $('#create-banned').prop('selectedIndex', 0);
                loadAdminPanel();
            }
        });
    });
});
