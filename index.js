/* jshint esversion:6 */

class Todo {
    constructor(title, description, date, category, done = false) {
        this.title = title;
        this.description = description;
        this.date = date;
        this.category=category;
        this.done = done;
    }
}

let todos = [];
let notificationTimeout = null;
let sortBy = 'title';
let sortDesc = true;

$(function() { // Same as $(document).ready();
    var now = new Date();
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);
    today = now.getFullYear()+"-"+(month)+"-"+(day) ;

    $('#date').val(today);

    $('#addButton').on('click', (e) => {
        e.preventDefault();
        addEntry();
        saveToLocalStorage();
    });
    $('#saveButton').on('click', (e) => {
        e.preventDefault();
        saveToFile();
    });
    $('#loadButton').on('click', (e) => loadFromFile(e));
    $('#todo').on('click', '.deleteButton', removeEntry);
    $('#todo').on('change', '.doneCheckbox', toggleDone);
    //$('#todo').on('change', '.doneCheckbox', removeEntry);

    // Load from cache
    loadFromLocalStorage();
    // Update from server
    loadFromFile();

    // Sorting
    $('input[name=options]').change(function() {
        $('input[name=options]').parent().removeClass('active');
        //$('input[name=options]:checked').parent().addClass('active');
        let checkedElement = $('input[name=options]:checked')
        console.log(this.value + $('input[name=options]:checked').data('desc'));
        sortTodos(this.value, checkedElement.data('desc') == 1 ? true : false);
    });
});

function render() {
    $('#todo tr').remove();

    // Sort
    todos.sort((a, b) => {
        if (sortDesc) {
            let temp = a;
            a = b;
            b = temp;
        }
        switch(sortBy) {
            case 'date':
                return new Date(a.date) - new Date(b.date);
            case 'done':
                return a.done - b.done;
            default:
                return a[sortBy].localeCompare(b[sortBy]);
        }
    })

    todos.forEach(function (todo, todoIndex) {
        //console.log(todo);
        let checked = '';
        if (todo.done) {
            checked = 'checked';
        }
        $('#todo').append('<tr>' + 
            '<td><input type="checkbox" class="doneCheckbox" data-id="' + todoIndex + '" name="done" value="1" ' + checked + '></td>' +
            '<td>' + todo.title + '</td>' + 
            '<td>' + todo.description + '</td>' +
            '<td class="text-nowrap">' + todo.date + '</td>' +
            '<td>' + todo.category + '</td>' +
            '<td><button class="editButton btn btn-sm btn-info">Muuda</button></td>' +
            '<td><button class="deleteButton btn btn-sm btn-danger" data-id="' + todoIndex + '" >Kustuta</button></td>' +
        '</tr>');
    });
}


function sortTodos(attribute, desc) {
    sortBy = attribute;
    sortDesc = desc;
    render();
}

function addEntry() {
    const titleValue = $('#title').val();
    const dateValue = $('#date').val();
    const descriptionValue = $('#description').val();
    const categoryValue= $('#category').val();

    todos.push(new Todo(titleValue, descriptionValue, dateValue,categoryValue));

    console.log(todos);
    render();
    save();
}

function save() {
    saveToLocalStorage();
    saveToFile();
}

function toggleDone() {
    let id = $(this).data('id');
    todos[id].done = this.checked;
    save();
}

function removeEntry(e) {
    e.preventDefault();
    let id = $(this).data('id');
    console.log(id);
    todos.splice(id, 1);
    render();
    save();
}

function saveToFile() {
    showNotification('Saving tasks to server...', false);
    $.post('server.php', { save: JSON.stringify(todos)})
        .done(function() {
            showNotification('Saved successfully...');
        })
        .fail(function () {
            alert('Failed to save to the server!');
        });
}

function loadFromFile() {
    showNotification('Updating tasks from the server...', false);
    $.ajax({
        cache: false,
        url: "database.txt",
        dataType: "json",
        success: function (data) {
            console.log(data.content);
            todos = arrayToTodoItems(data.content);
            console.log(todos);
            render();
            
            showNotification('Loaded tasks from the server.');

            // Update cache
            saveToLocalStorage();
        }
    });
    return false;
}

function saveToLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function loadFromLocalStorage() {
    let items = localStorage.getItem('todos');
    if (items) {
        todos = arrayToTodoItems(JSON.parse(items));
        console.log(todos);
        render();
    }

}

function arrayToTodoItems(items) {
    let objects = [];
    items.forEach(todo => {
        objects.push(new Todo(todo.title, todo.description, todo.date, todo.category, todo.done));
    });
    return objects;
}

function showNotification(message, autoHide = true) {
    $('#notification').show();
    $('#notification').text(message);
    if (notificationTimeout != null) {
        clearTimeout(notificationTimeout);
    }
    if (autoHide) {
        notificationTimeout = setTimeout(hideNotification, 4000);
    }
}

function hideNotification() {
    $('#notification').hide();
    notificationTimeout = null;
}
